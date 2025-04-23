import React from 'react';

interface VideoPlayerProps {
  videoUrl: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      // Extract video ID from watch URL
      const videoId = new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      // Extract video ID from short URL
      const videoId = url.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Return original URL if not YouTube or already in embed format
    return url;
  };

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-md">
      {/* console.log({videoUrl}) */}
      <iframe
        src={getEmbedUrl(videoUrl)}
        title="Crowdfunding Campaign Video"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
};

export default VideoPlayer; 