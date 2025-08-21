import * as fal from "@fal-ai/serverless-client";

type GenerateParams = {
  prompt: string;
  width: number;
  height: number;
  numOutputs: number;
};

export async function callFalGenerate({ prompt, width, height, numOutputs }: GenerateParams) {
  const key = process.env.FAL_KEY;
  if (!key) {
    // Mock for local dev without key
    return Array.from({ length: numOutputs }).map((_, i) => ({
      url: `https://picsum.photos/seed/${encodeURIComponent(prompt)}-${i}/${width}/${height}`,
      width,
      height,
    }));
  }

  // 支持两种 Key 格式
  if (key.includes(':')) {
    // Client ID:Secret 格式 (你的格式)
    const [clientId, clientSecret] = key.split(':');
    fal.config({ 
      credentials: {
        id: clientId,
        secret: clientSecret
      }
    });
  } else {
    // Serverless Key 格式 (fal_sk_...)
    fal.config({ credentials: key });
  }

  // Model id per playground page, adjust if needed
  const MODEL_ID = "fal-ai/qwen-image";
  try {
    const result: any = await fal.run(MODEL_ID, {
      input: {
        prompt,
        image_size: { width, height },
        num_images: numOutputs,
      },
      logs: true,
    });

    const images = (result.images ?? []).map((img: any) => ({
      url: img.url,
      width: img.width ?? width,
      height: img.height ?? height,
    }));
    if (!images.length) {
      throw new Error("FAL returned no images");
    }
    return images;
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error("FAL generate error:", message);
    throw new Error(message);
  }
}




