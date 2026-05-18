 
 
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

// export const metadata = {
//   title: "Vouch | Buy Gift Vouchers Online Instantly",
//   description:
//     "Send digital gift vouchers instantly with Vouch. Choose from a wide range of vendors and surprise someone special in seconds.",
//   keywords: [
//     "gift vouchers",
//     "buy vouchers online",
//     "digital gifts",
//     "instant voucher delivery",
//     "vouch",
//     "voucher gifting",
//   ],
//   openGraph: {
//     title: "Vouch | Buy Gift Vouchers Online Instantly",
//     description:
//       "Send digital gift vouchers instantly with Vouch. Choose from a wide range of vendors and surprise someone special in seconds.",
//     url: "https://www.vouch.gift", // replace with actual URL
//     siteName: "Vouch",
//     images: [
//       {
//         url: "/images/MainLogo.png", // replace with your OG image
//         width: 916,
//         height: 1010,
//         alt: "Vouch – Digital Gift Vouchers",
//       },
//     ],
//     type: "website",
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "Vouch | Buy Gift Vouchers Online Instantly",
//     description:
//       "Surprise your loved ones with instant gift vouchers online. Vouch makes gifting easy and thoughtful.",
//     images: ["/images/MainLogo.png"], // same image as OG
//   },
//   alternates: {
//     canonical: "https://www.vouch.gift/",
//   },
// };

// This is a server component
export default async function HomePage() {
  // Server-side random logic
  const isWhiteMask = Math.random() < 0.5;
  const maskSrc = isWhiteMask
    ? "/masks/1920maskwhite.png"
    : "/masks/1920maskblack.png";

  return (
    <>
      <div
        className={`w-full h-screen overflow-hidden ${
          isWhiteMask ? "" : "bg-black"
        }`}
      >
        <div className="relative h-full">
          <div className="h-screen">
            <Image
              className="absolute top-0 left-0 z-10 object-scale-down md:max-h-[560px]"
              width={1920}
              height={1080}
              alt="background"
              src="https://picsum.photos/1920/1080"
            />
            <Image
              className="absolute top-0 left-0 z-20 object-scale-down md:max-h-[560px] "
              width={1920}
              height={1080}
              alt="mask"
              src={maskSrc}
            />
          </div>
        </div>
      </div>
      <div className="z-50 absolute md:top-2/3 top-1/2 text-center flex md:justify-start justify-end flex-col w-full items-center">
        <h1
          className={`text-3xl md:text-8xl font-bold capitalize ${
            isWhiteMask ? "text-gray-600" : "text-gray-200"
          } `}
        >
          Vouch
        </h1>
        <h2
          className={`text-xl md:text-6xl font-bold  ${
            isWhiteMask ? "text-gray-600" : "text-gray-200"
          } `}
        >
          Gifting made easy
        </h2>
        <div className="flex flex-row gap-4 pt-4">
          <Link href={"/create-vouch"}>
            <Button>Create Vouch</Button>
          </Link>
          <Link href={"/gift-ideas"}>
            <Button>View Gift Ideas</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
