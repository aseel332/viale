import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#FAFAF8]">{children}</main>
      <Footer />
    </>
  );
};

export default AppLayout;