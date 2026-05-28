import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen">
        {children}
        <Footer />
      </div>
      <ChatPanel />
    </>
  );
}
