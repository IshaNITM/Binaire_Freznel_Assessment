export class ApiService {
  static async uploadCsv(file, priority, clientId, onUploadProgress) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("priority", priority);
      formData.append("clientId", clientId);

      if (xhr.upload && onUploadProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onUploadProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true, job: response.job });
          } else {
            resolve({
              success: false,
              error: response.error || "Upload failed",
            });
          }
        } catch (e) {
          resolve({ success: false, error: "Invalid response from server" });
        }
      };

      xhr.onerror = () => {
        resolve({ success: false, error: "Network error during upload" });
      };

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  }
}
