import axios from "axios";

async function getFinalUrl(mediaUrl, maxRetries = 10, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    const { data } = await axios.get(mediaUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
      },
    });

    if (data?.fileUrl) return data.fileUrl;
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return null;
}

export async function scrapeYtdown(url) {
  if (!url) throw new Error("Falta la URL");

  const payload = new URLSearchParams({ url });

  const { data } = await axios.post(
    "https://ytdown.to/proxy.php",
    payload.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "*/*",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
        Referer: "https://ytdown.to/es2/",
      },
    }
  );

  const items = data?.api?.mediaItems ?? [];

  const videoItem = items.find((i) => i.type === "Video");
  const audioItem = items.find((i) => i.type === "Audio");

  const [videoUrl, audioUrl] = await Promise.all([
    videoItem ? getFinalUrl(videoItem.mediaUrl) : null,
    audioItem ? getFinalUrl(audioItem.mediaUrl) : null,
  ]);

  const video =
    videoItem && videoUrl
      ? {
          quality: videoItem.mediaQuality,
          size: videoItem.mediaFileSize,
          format: videoItem.mediaExtension,
          url: videoUrl,
        }
      : null;

  const audio =
    audioItem && audioUrl
      ? {
          quality: audioItem.mediaQuality,
          size: audioItem.mediaFileSize,
          format: audioItem.mediaExtension,
          url: audioUrl,
        }
      : null;

  return { video, audio };
}