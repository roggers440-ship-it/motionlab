import { ogImage, ogSize } from "@/lib/og";
import { demos } from "@/demos/registry";
import { site } from "@/lib/site";

export const size = ogSize;
export const contentType = "image/png";
export const alt = `${site.name} — ${site.tagline}`;

export default function Image() {
  return ogImage({
    eyebrow: `${demos.length} interactive demos`,
    title: `${site.name}`,
    subtitle:
      "UI physics · scroll timelines · WebGL · shaders · Rive & Lottie · simulations",
  });
}
