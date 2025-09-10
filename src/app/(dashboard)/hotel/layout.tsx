"use client";
import HotelLayout from "@/components/layout/hotel-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <HotelLayout>
      {children}
    </HotelLayout>
  );
}