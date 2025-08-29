import Header from "./header";
import Footer from "./footer";

interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function BaseLayout({ children, className = "" }: BaseLayoutProps) {
  return (
  <div className={`min-h-screen bg-gray9 font-body ${className}`}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
