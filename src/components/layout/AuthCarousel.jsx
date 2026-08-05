import { useEffect, useState } from "react";

import img1 from "@/assets/login/img-1.jpeg";
import img2 from "@/assets/login/img-2.jpeg";
import img3 from "@/assets/login/img-3.jpeg";
import img4 from "@/assets/login/img-4.jpeg";
import img5 from "@/assets/login/img-5.jpeg";
import img6 from "@/assets/login/img-6.jpeg";
import img8 from "@/assets/login/img-8.jpeg";
import img9 from "@/assets/login/img-9.jpeg";

const images = [img1, img2, img3, img4, img5, img6, img8, img9];

export function AuthCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative hidden overflow-hidden lg:block">
      {images.map((image, index) => (
        <img
          key={image}
          src={image}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[5000ms] ${current === index
              ? "scale-105 opacity-100"
              : "scale-100 opacity-0"
            }`}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Degradado hacia el formulario */}
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-r from-transparent to-background/20" />
    </div>
  );
}