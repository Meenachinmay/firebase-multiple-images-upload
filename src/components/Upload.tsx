import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/clientApp";

const Upload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [downloadableUrls, setDownloadableUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  // Get User input as image files
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...e.target.files]);
    }
  };

  // handle upload images. Call this method onClic
  const handleUpload = async () => {
    const storageRef = ref(storage);

    // prepare upload here
    const uploadTasks = selectedFiles.map((file) => {
      const fileRef = ref(storageRef, `events/${file.name}`);
      const task = uploadBytesResumable(fileRef, file);
      // Listen to the state_changed event to track progress
      task.on("state_changed", (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress((prevProgress) => [...prevProgress, progress]);
      });
      return task;
    });

    // upload files from here and get downloadable URL
    try {
      const uploadSnapshots = await Promise.all(uploadTasks);
      console.log("started....");
      const urls = await Promise.all(
        uploadSnapshots.map((snapshot) => getDownloadURL(snapshot.ref))
      );
      setDownloadableUrls(urls);
      setUploadProgress([]);
      console.log("finished uploading...");
    } catch (error) {
      console.error("Error uploading images:", error);
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileInputChange} />
      <button onClick={handleUpload}>Upload Images</button>

      {uploadProgress.length > 0 && (
        <div>
          <h2>Upload Progress:</h2>
          <ul>
            {uploadProgress.map((progress, index) => (
              <li key={index}>{`File ${index + 1}: ${progress.toFixed(
                2
              )}%`}</li>
            ))}
          </ul>
        </div>
      )}

      {downloadableUrls.length > 0 && (
        <div>
          <h2>Downloadable URLs:</h2>
          <ul>
            {downloadableUrls.map((url, index) => (
              <li key={index}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Upload;

function onUploadTaskStateChanged(
  task: Promise<import("@firebase/storage").UploadResult>,
  arg1: (snapshot: any) => void
) {
  throw new Error("Function not implemented.");
}
