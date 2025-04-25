import cv2
import threading
import time
from typing import List, Dict, Any
from picamera2 import Picamera2
import requests
import RPi.GPIO as GPIO
from web3 import Web3
import json
import socket

# Constants for sensitive information
BLOCKCHAIN_URL = "YOUR_BLOCKCHAIN_URL"
PRIVATE_KEY = "YOUR_PRIVATE_KEY"
CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS"

# Setup web3 connection
web3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_URL))

# Add the private key for signing transactions
account = web3.eth.account.from_key(PRIVATE_KEY)
wallet_address = account.address
print(f"Using wallet address: {wallet_address}")

# Contract details
try:
    with open('abi.json', 'r') as file:
        contract_abi = json.load(file)
    contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)
    print("Contract ABI loaded successfully")
except Exception as e:
    print(f"Error loading contract ABI: {e}")
    contract = None

# Set up GPIO for buzzer, button, and LEDs
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BOARD) 
BUZZER_PIN = 11
BUTTON_PIN = 10
GREEN_LED_PIN = 15
RED_LED_PIN = 13

GPIO.setup(BUZZER_PIN, GPIO.OUT)
GPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.setup(GREEN_LED_PIN, GPIO.OUT)
GPIO.setup(RED_LED_PIN, GPIO.OUT)

GPIO.output(GREEN_LED_PIN, GPIO.LOW)
GPIO.output(RED_LED_PIN, GPIO.LOW)

button_running = True

picam2 = Picamera2()
picam2.preview_configuration.main.size = (720, 720)
picam2.preview_configuration.main.format = "BGR888"
picam2.preview_configuration.align()
picam2.configure("preview")
picam2.start()

qr_detector = cv2.QRCodeDetector()

frame_queue: List[cv2.typing.MatLike] = []
results_ready = False
latest_results: cv2.typing.MatLike = None
latest_fps: float = 0.0
running = True
scanning = False
qr_data = ""
qr_confidence = 0.0

items_to_scan = 2
scanned_items: List[str] = []
scanning_complete = False
current_item = 0
last_scan_time: float = 0.0
last_duplicate_time: float = 0.0
awaiting_contract_data = False
blockchain_processing = False

skip_frames = 4

def get_current_location():
    """Get the current location of the Raspberry Pi"""
    try:
        # This is a placeholder - implement actual location detection
        # Could use GPS module, IP geolocation, or other methods
        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)
        
        # For demonstration, return a default location
        # In production, this should be replaced with actual location detection
        return f"Location_{hostname}"
    except Exception as e:
        print(f"Error getting location: {e}")
        return "Unknown_Location"
        
current_location = get_current_location()
locations = [current_location, "Final_Destination"]
current_location_index = 0
arrived_status = False

def beep_buzzer(times=1, duration=0.2, pause=0.2):
    for _ in range(times):
        GPIO.output(BUZZER_PIN, GPIO.HIGH)
        time.sleep(duration)
        GPIO.output(BUZZER_PIN, GPIO.LOW)
        if _ < times - 1:
            time.sleep(pause)

def update_leds(scanning_state, contract_call=False):
    global blockchain_processing
    
    if contract_call or blockchain_processing:
        print("LED: Setting RED ON for blockchain processing")
        GPIO.output(GREEN_LED_PIN, GPIO.LOW)
        GPIO.output(RED_LED_PIN, GPIO.HIGH)
    elif scanning_state:
        print("LED: Setting GREEN ON for scanning")
        GPIO.output(GREEN_LED_PIN, GPIO.HIGH)
        GPIO.output(RED_LED_PIN, GPIO.LOW)
    else:
        print("LED: Setting RED ON for processing")
        GPIO.output(GREEN_LED_PIN, GPIO.LOW)
        GPIO.output(RED_LED_PIN, GPIO.HIGH)

def get_token_id_from_tx(transaction_hash):
    try:
        if not web3.is_connected() or contract is None:
            print("Web3 not connected or contract not initialized")
            return None
            
        print(f"Fetching transaction receipt for {transaction_hash}...")
        receipt = web3.eth.get_transaction_receipt(transaction_hash)
        
        print(f"Found {len(receipt['logs'])} logs in transaction")
        
        print("Looking for ItemCreated event...")
        for log in receipt['logs']:
            try:
                decoded_log = contract.events.ItemCreated().process_log(log)
                if decoded_log:
                    print("Found ItemCreated event!")
                    return decoded_log['args']['tokenId']
            except:
                pass
        
        print("Looking for Transfer event...")
        for log in receipt['logs']:
            if len(log['topics']) == 4:
                print(f"Found potential Transfer event with 4 topics")
                try:
                    token_id = int(log['topics'][3].hex(), 16)
                    print(f"Extracted token ID: {token_id}")
                    return token_id
                except Exception as e:
                    print(f"  Error extracting token ID: {e}")
        
        print("Could not determine token ID from transaction")
        return 1
    
    except Exception as e:
        print(f"Error getting token ID: {e}")
        return None

def get_pool_id_from_nft(token_id):
    try:
        if not web3.is_connected() or contract is None:
            print("Web3 not connected or contract not initialized")
            return None
            
        item_details = contract.functions.getItemDetails(token_id).call()
        return item_details[2]
    except Exception as e:
        print(f"Error getting pool ID: {e}")
        return None

def get_pool_items_count(pool_id):
    try:
        if not web3.is_connected() or contract is None:
            print("Web3 not connected or contract not initialized")
            return 0
            
        items = contract.functions.getPoolItems(pool_id).call()
        return len(items)
    except Exception as e:
        print(f"Error getting pool items count: {e}")
        return 0

def process_transaction_hash(tx_hash):
    global items_to_scan
    
    if ':' in tx_hash:
        tx_hash = tx_hash.split(':')[-1].strip()
    
    if not tx_hash.startswith('0x'):
        tx_hash = '0x' + tx_hash
    
    print(f"\n===== PROCESSING TRANSACTION HASH =====")
    print(f"Transaction Hash: {tx_hash}")
    
    token_id = get_token_id_from_tx(tx_hash)
    if token_id is None:
        print("Could not determine token ID, using default item count")
        return 2
    
    print(f"Found Token ID: {token_id}")
    
    pool_id = get_pool_id_from_nft(token_id)
    if pool_id is None:
        print("Could not determine pool ID, using default item count")
        return 2
    
    print(f"Found Pool ID: {pool_id}")
    
    pool_items_count = get_pool_items_count(pool_id)
    if pool_items_count <= 0:
        print("Pool is empty or error occurred, using default item count")
        return 2
    
    print(f"Number of items in pool: {pool_items_count}")
    print("=====================================\n")
    
    return pool_items_count

def button_monitor():
    while button_running:
        try:
            if GPIO.input(BUTTON_PIN) == GPIO.HIGH:
                print("Button was pushed! Starting/resetting scan process...")
                reset_and_start_scan()
                while GPIO.input(BUTTON_PIN) == GPIO.HIGH and button_running:
                    time.sleep(0.01)
                time.sleep(0.2)
            time.sleep(0.05)
        except Exception as e:
            print(f"Error in button monitor: {e}")
            time.sleep(0.1)

def reset_and_start_scan():
    global scanning, qr_data, scanned_items, scanning_complete, current_item
    global last_scan_time, last_duplicate_time, items_to_scan, awaiting_contract_data
    global blockchain_processing, current_location_index, arrived_status
    
    print("\n======= NEW SCAN STARTED =======")
    
    if current_location_index == 0 and not arrived_status and scanned_items:
        arrived_status = True
    
    if arrived_status:
        print("Status: IT IS ARRIVED!")
    else:
        print(f"Current Location: {locations[current_location_index]}")
    
    print("First scan transaction hash to determine items count")
    print("=================================\n")
    
    scanning = True
    qr_data = ""
    scanned_items = []
    scanning_complete = False
    current_item = 0
    last_scan_time = 0.0
    last_duplicate_time = 0.0
    awaiting_contract_data = True
    blockchain_processing = False
    
    while frame_queue:
        frame_queue.pop()
    
    update_leds(scanning)
    
    beep_buzzer(2)

def update_status_with_debug(message):
    print(message)

def process_scan_result():
    global scanning, qr_data, scanned_items, current_item, scanning_complete
    global last_scan_time, last_duplicate_time, items_to_scan, awaiting_contract_data
    global blockchain_processing
    
    if not scanning and qr_data and current_item < items_to_scan and not scanning_complete:
        if qr_data not in scanned_items:
            scanned_items.append(qr_data)
            current_item += 1
            
            beep_buzzer(1)
            
            if current_item == 1 and awaiting_contract_data:
                update_status_with_debug("First item scanned! Processing transaction hash...")
                
                blockchain_processing = True
                update_leds(False, contract_call=True)
                
                def process_tx_thread(transaction_hash):
                    global items_to_scan, awaiting_contract_data, blockchain_processing
                    try:
                        new_items_count = process_transaction_hash(transaction_hash)
                        items_to_scan = max(new_items_count, 1)
                        
                        update_status_with_debug(f"Total items to scan determined from contract: {items_to_scan}")
                        
                        blockchain_processing = False
                        
                        if current_item < items_to_scan:
                            update_status_with_debug(f"Scanned {current_item}/{items_to_scan}. Next scan in 1 second...")
                            scanning = True
                            qr_data = ""
                            update_leds(scanning)
                        else:
                            scanning_complete = True
                            update_status_with_debug(f"All {items_to_scan} items scanned!")
                            handle_scanning_complete()
                        
                        awaiting_contract_data = False
                    except Exception as e:
                        print(f"Error processing transaction: {e}")
                        items_to_scan = 2
                        awaiting_contract_data = False
                        blockchain_processing = False
                        
                        print("Blockchain data fetch complete. Ready for next scan.")
                        scanning = True
                        qr_data = ""
                        update_leds(scanning)
                
                tx_hash_to_process = qr_data
                
                tx_thread = threading.Thread(target=process_tx_thread, args=(tx_hash_to_process,))
                tx_thread.daemon = True
                tx_thread.start()
                
                return
            
            if current_item < items_to_scan:
                update_status_with_debug(f"Scanned item {current_item}/{items_to_scan}. Next scan in 1 second...")
                last_scan_time = time.time()
                
                while frame_queue:
                    frame_queue.pop()
                
                scanning = True
                qr_data = ""
                
                if not blockchain_processing:
                    update_leds(scanning)
            else:
                scanning_complete = True
                update_status_with_debug(f"All {items_to_scan} items scanned!")
                handle_scanning_complete()
        else:
            current_time = time.time()
            if current_time - last_duplicate_time >= 1.0:
                update_status_with_debug(f"Item already scanned! ({current_item}/{items_to_scan})")
                last_duplicate_time = current_time
                
                if current_time - last_scan_time >= 2.0:
                    scanning = True
                    qr_data = ""
                    update_status_with_debug(f"Auto-advancing to scan item {current_item+1} of {items_to_scan}...")
                    
                    while frame_queue:
                        frame_queue.pop()
                    
                    if not blockchain_processing:
                        update_leds(scanning)

def update_pool_location(pool_id, location):
    global blockchain_processing
    
    try:
        if not web3.is_connected() or contract is None:
            print("Web3 not connected or contract not initialized")
            return False
            
        print(f"\n===== UPDATING POOL LOCATION ON BLOCKCHAIN =====")
        print(f"Pool ID: {pool_id}")
        print(f"New Location: {location}")
        
        blockchain_processing = True
        update_leds(False, contract_call=True)
        
        tx = contract.functions.updatePoolItemsLocation(pool_id, location).build_transaction({
            'from': wallet_address,
            'nonce': web3.eth.get_transaction_count(wallet_address),
            'gas': 500000, 
            'gasPrice': web3.eth.gas_price
        })
        
        signed_tx = web3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        
        print(f"Signed transaction structure: {dir(signed_tx)}")
        
        raw_tx = None
        if hasattr(signed_tx, 'rawTransaction'):
            raw_tx = signed_tx.rawTransaction
        elif hasattr(signed_tx, 'raw_transaction'):
            raw_tx = signed_tx.raw_transaction
        else:
            possible_attrs = ['rawTransaction', 'raw_transaction', 'raw']
            for attr in possible_attrs:
                try:
                    if hasattr(signed_tx, attr):
                        raw_tx = getattr(signed_tx, attr)
                        print(f"Found raw transaction using attribute: {attr}")
                        break
                except Exception as e:
                    print(f"Error accessing {attr}: {e}")
            
            if raw_tx is None:
                try:
                    if isinstance(signed_tx, dict) and 'rawTransaction' in signed_tx:
                        raw_tx = signed_tx['rawTransaction']
                        print("Found raw transaction in dictionary")
                    elif isinstance(signed_tx, dict) and 'raw_transaction' in signed_tx:
                        raw_tx = signed_tx['raw_transaction']
                        print("Found raw transaction in dictionary")
                    else:
                        print(f"Transaction structure: {type(signed_tx)}")
                        if hasattr(signed_tx, '__dict__'):
                            print(f"Transaction dict: {signed_tx.__dict__}")
                except Exception as e:
                    print(f"Error accessing dictionary: {e}")
        
        if raw_tx is None:
            raise Exception("Could not get raw transaction data - please check web3.py version")
            
        tx_hash = web3.eth.send_raw_transaction(raw_tx)
        
        print(f"Transaction sent: {tx_hash.hex()}")
        print("Waiting for transaction confirmation...")
        
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt.status == 1:
            print("Transaction successful!")
            print(f"Gas used: {receipt.gasUsed}")
            print("=====================================\n")
            return True
        else:
            print("Transaction failed!")
            print("=====================================\n")
            return False
            
    except Exception as e:
        print(f"Error updating pool location: {e}")
        print("=====================================\n")
        return False
    finally:
        blockchain_processing = False
        update_leds(scanning)

def handle_scanning_complete():
    global scanning, qr_data, current_location_index, arrived_status, blockchain_processing
    
    beep_buzzer(3)
    
    current_location = locations[current_location_index]
    
    print("\n===== SCANNED ITEMS =====")
    
    if arrived_status:
        print("Status: IT IS ARRIVED!")
    else:
        print(f"Location: {current_location}")
    
    print("------------------------")
    for i, item in enumerate(scanned_items):
        print(f"Item {i+1}: {item}")
    print("========================\n")
    
    pool_id = None
    if len(scanned_items) > 0:
        try:
            tx_hash = scanned_items[0]
            if ':' in tx_hash:
                tx_hash = tx_hash.split(':')[-1].strip()
            if not tx_hash.startswith('0x'):
                tx_hash = '0x' + tx_hash
                
            token_id = get_token_id_from_tx(tx_hash)
            if token_id is not None:
                pool_id = get_pool_id_from_nft(token_id)
                print(f"Got pool ID: {pool_id} from token ID: {token_id}")
        except Exception as e:
            print(f"Error getting pool ID from transaction: {e}")
    
    if pool_id is not None and not arrived_status:
        print(f"Updating pool location to {current_location} on blockchain...")
        
        blockchain_processing = True
        update_leds(False, contract_call=True)
        
        def update_location_thread(pool_id, location):
            success = update_pool_location(pool_id, location)
            global blockchain_processing
            blockchain_processing = False
            update_leds(scanning)
            
            if success:
                print("Transaction successful! Beeping 4 times...")
                beep_buzzer(4, duration=0.15, pause=0.15)
        
        loc_thread = threading.Thread(target=update_location_thread, args=(pool_id, current_location))
        loc_thread.daemon = True
        loc_thread.start()
    
    previous_location_index = current_location_index
    
    current_location_index = (current_location_index + 1) % len(locations)
    
    if previous_location_index == len(locations)-1 and current_location_index == 0:
        print("All destinations visited - IT IS ARRIVED!")
    
    print("Scan complete. Press the button to scan again.")

def camera_loop():
    global frame_count, last_frame, running
    
    cv2.namedWindow("Camera")
    cv2.moveWindow("Camera", 500, 50)
    
    frames_to_skip = 0
    last_frame = None
    
    while running:
        try:
            frame = picam2.capture_array()
            if frame is None:
                print("Warning: Empty frame captured. Retrying...")
                time.sleep(0.1)
                continue
                
            last_frame = frame.copy()
            
            indicator_frame = last_frame.copy()
            
            scan_state = "SCANNING" if scanning else "NOT SCANNING"
            blockchain_state = "BLOCKCHAIN PROCESSING" if blockchain_processing else ""
            cv2.putText(indicator_frame, f"{scan_state} {blockchain_state}", (10, last_frame.shape[0]-10), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            frames_to_skip = (frames_to_skip + 1) % skip_frames
            
            if scanning and frames_to_skip == 0 and len(frame_queue) < 2:
                frame_queue.append(frame.copy())
                cv2.putText(indicator_frame, "ADDED TO QUEUE", (10, last_frame.shape[0]-30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
            if not scanning and qr_data and not scanning_complete:
                cv2.putText(indicator_frame, f"QR Data: {qr_data}", (10, 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(indicator_frame, f"Scanned {current_item}/{items_to_scan}", (10, 60), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                if blockchain_processing:
                    cv2.putText(indicator_frame, "PROCESSING BLOCKCHAIN DATA...", (10, 90),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                else:
                    cv2.putText(indicator_frame, "Waiting for next scan...", (10, 90),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
            elif scanning:
                cv2.putText(indicator_frame, f"ACTIVELY SCANNING for item {current_item+1}...", (10, 30),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                if results_ready and latest_results is not None:
                    indicator_frame = latest_results.copy()
                    cv2.putText(indicator_frame, f"ACTIVELY SCANNING for item {current_item+1}...", (10, 30),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    
                    cv2.putText(indicator_frame, f"Queue: {len(frame_queue)}", (10, 120),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            elif scanning_complete:
                cv2.putText(indicator_frame, "SCAN COMPLETE - Press button to scan again", (10, 30),
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                if arrived_status:
                    cv2.putText(indicator_frame, "IT IS ARRIVED!", (10, 60),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                else:
                    previous_location_index = (current_location_index - 1) % len(locations)
                    location = locations[previous_location_index]
                    cv2.putText(indicator_frame, f"Location: {location}", (10, 60),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                if blockchain_processing:
                    cv2.putText(indicator_frame, "UPDATING BLOCKCHAIN...", (10, 90),
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                y_pos = 120 if blockchain_processing else 90
                for i, item in enumerate(scanned_items):
                    y_pos += 30
                    if y_pos < indicator_frame.shape[0] - 10:
                        cv2.putText(indicator_frame, f"{i+1}: {item}", (10, y_pos), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            cv2.imshow("Camera", indicator_frame)
            
            frame_count += 1
            
            key = cv2.waitKey(1)
            if key == ord("q"):
                running = False
                break
            elif key == ord("r"):
                reset_and_start_scan()
                
        except Exception as e:
            print(f"Error in camera loop: {e}")
            time.sleep(0.1)
            
    cv2.destroyAllWindows()

def inference_worker():
    global scanning, qr_data, qr_confidence, latest_results, latest_fps, results_ready
    
    while running:
        if frame_queue and scanning:
            try:
                frame_to_process = frame_queue.pop(0)
                
                start_time = time.time()
                
                try:
                    data, bbox, _ = qr_detector.detectAndDecode(frame_to_process)
                except cv2.error as qr_error:
                    if "Invalid QR code source points" in str(qr_error):
                        data, bbox = "", None
                    else:
                        print(f"QR detection error: {qr_error}")
                        data, bbox = "", None
                
                process_time = time.time() - start_time
                fps = 1.0 / process_time if process_time > 0 else 0.0
                
                annotated_frame = frame_to_process.copy()
                
                if data and bbox is not None:
                    qr_area = cv2.contourArea(bbox.astype(int))
                    frame_area = frame_to_process.shape[0] * frame_to_process.shape[1]
                    confidence = (qr_area / frame_area) * 100
                    
                    pts = bbox.astype(int).reshape((-1, 1, 2))
                    cv2.polylines(annotated_frame, [pts], True, (0, 255, 0), 2)
                    
                    conf_text = f"Confidence: {confidence:.1f}"
                    cv2.putText(annotated_frame, conf_text, (10, 30), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    
                    if confidence > 5.0:
                        qr_data = data
                        qr_confidence = confidence
                        scanning = False
                        
                        if not blockchain_processing:
                            update_leds(scanning)
                            
                        print(f"QR detected: {data} with confidence {confidence:.1f}")
                
                text = f'FPS: {fps:.1f}'
                cv2.putText(annotated_frame, text, (10, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                latest_results = annotated_frame
                latest_fps = fps
                results_ready = True
            except Exception as e:
                print(f"Error in inference worker: {e}")
                time.sleep(0.1)
        else:
            time.sleep(0.001)

last_frame = None
frame_count = 0

update_leds(True)

worker_thread = threading.Thread(target=inference_worker)
worker_thread.daemon = True
worker_thread.start()

button_thread = threading.Thread(target=button_monitor)
button_thread.daemon = True
button_thread.start()

def update_loop():
    while running:
        try:
            process_scan_result()
            time.sleep(0.1)
        except Exception as e:
            print(f"Error in update loop: {e}")
            time.sleep(0.1)

update_thread = threading.Thread(target=update_loop)
update_thread.daemon = True
update_thread.start()

print("System ready. Press the button to start scanning.")
print("Press 'q' in the camera window to quit.")
print("Press 'r' in the camera window to reset scanning.")
camera_loop()

running = False
button_running = False

GPIO.output(GREEN_LED_PIN, GPIO.LOW)
GPIO.output(RED_LED_PIN, GPIO.LOW)

worker_thread.join(timeout=1.0)
button_thread.join(timeout=1.0)
update_thread.join(timeout=1.0)
GPIO.cleanup()