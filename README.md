## Video Transcoding Service

This project is a scalable video transcoding system built on AWS services and Node.js, aimed at automatically generating multiple resolutions of uploaded videos. Internally uses **HLS (HTTP Live Streaming)** and **FFmpeg** to generate multiple resolutions of the video.

### Demo

Here is the backend demo of the video transcoding service:

[![Video Transcoding Service](/images/wallpaper.png)](https://youtu.be/hsIb15Cj6qc)

### Features

- **Automatic Video Transcoding**: Automatically transcode the uploaded video into multiple resolutions.
- **Scalable**: The system is built on AWS services, making it scalable and reliable.
- **Adaptive Bitrate Streaming**: Uses HLS to generate multiple resolutions of the video for adaptive bitrate streaming.
- **Dockerized**: The system is dockerized for easy deployment and scaling.

### Architecture

The system is built on AWS services, including S3, Lambda, API Gateway, ECR and ECS. The architecture is as follows:

1. User uploads a video to the S3 bucket.
2. S3 triggers a Lambda function to transcode the video into multiple resolutions.
3. The Lambda function sends the transcoded videos to another S3 bucket.

![Architecture Diagram](/images/video_transcoding_service_white.png)

### Technologies

- Node.js
- AWS (S3, Lambda, API Gateway, ECR, ECS)
- Docker

### Problems faced

- **Unable to access the transcoded videos**: The transcoded videos were not accessible due to incorrect permissions. This was resolved by updating the bucket policy to allow public access.
- **Error while downloading video on docker**: The video was not downloading on the docker container due to incorrect path. This was resolved by updating the path to the video in the code.
- **Video transcoding taking too long**: The transcoding process was taking too long due to the large size of the video. Use worker threads to improve the performance of the transcoding process.

### Future Scope

- **DRM (Digital Rights Management)**: Implement DRM to protect the content from unauthorized access.
- **Live Streaming**: Implement live streaming of videos using HLS.
- **Automatically captions generation**: Automatically generate captions for the videos using machine learning.

### Contact

Feel free to contact me at [email](mailto:varshilshah.in@gmail.com) for any queries or suggestions.
