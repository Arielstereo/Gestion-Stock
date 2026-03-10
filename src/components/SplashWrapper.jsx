"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";

export default function SplashWrapper({ children }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const already = sessionStorage.getItem("splashShown");
    if (!already) setShowSplash(true);
  }, []);

  const handleComplete = () => {
    sessionStorage.setItem("splashShown", "1");
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleComplete} />}
      <div className={showSplash ? "invisible" : "visible"}>{children}</div>
    </>
  );
}
