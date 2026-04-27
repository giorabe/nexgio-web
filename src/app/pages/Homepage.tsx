import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wifi, Wrench, Printer, Palette } from "lucide-react";
import Logo from "@/assets/NexGio LOGO B.png";

const Homepage: React.FC = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0F0F0F] text-white flex flex-col">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(#F5C400 1px, transparent 1px),
              linear-gradient(90deg, #F5C400 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center, transparent 0%, #0F0F0F 70%)",
          }}
        />
      </div>

      <header className="bg-[#161616] border-b border-[#2A2A2A] fixed inset-x-0 top-0 z-50 h-16">
        <div className="container mx-auto h-full flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={Logo} alt="NexGio Logo" className="w-8 h-8 rounded-sm" />
              <span className="text-2xl font-semibold">NexGio</span>
            </Link>
            <nav className="hidden md:flex space-x-4 text-sm text-[#A0A0A0]">
              <Link to="/" className="hover:text-white">Home</Link>
              <a href="#about" className="hover:text-white">About</a>
              <a href="#contact" className="hover:text-white">Contact</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/client/services" className="px-4 py-2 bg-[#F5C400] text-[#0F0F0F] rounded-md text-sm">
              Open Portal
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section className="py-24">
          <div className="container mx-auto px-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-40 h-40 rounded-2xl bg-gradient-to-br from-[#F5C400] to-[#F5C400]/80 mb-6 shadow-lg shadow-[#F5C400]/20">
                <img src={Logo} alt="NexGio Logo" className="w-40 h-auto rounded-2xl" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white">NexGio</h1>
            <p className="mt-4 text-xl text-[#A0A0A0]">Where Connection Meets Creation.</p>
            <p className="mt-6 max-w-2xl mx-auto text-[#A0A0A0]">
              Affordable internet, reliable repair, and creative design in one place.
            </p>
            {/* hero CTAs removed — top Message Us replaces Login */}
          </div>
        </section>

        <section id="about" className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-semibold text-white">About Us</h2>
            <p className="mt-3 text-[#A0A0A0] max-w-3xl">
              NexGio is a multi-service brand offering internet solutions, phone repair, and creative design services. Built from experience since 2020, we aim to provide practical, affordable, and reliable solutions for everyday needs.
            </p>
          </div>
        </section>

        <section id="services" className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-semibold text-white">Our Services</h2>
            <p className="mt-3 text-[#A0A0A0] max-w-3xl">Choose a service to open its client portal.</p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  id: "internet",
                  name: "Internet Service",
                  description: "Manage your WiFi subscription, view invoices, and pay bills",
                  icon: Wifi,
                  color: "#F5C400",
                  path: "/client/login?next=/client/dashboard",
                },
                {
                  id: "repair",
                  name: "Repair Services",
                  description: "Track your device repairs and service requests",
                  icon: Wrench,
                  color: "#28C76F",
                  path: "#",
                  disabled: true,
                },
                {
                  id: "graphics",
                  name: "Graphics Services",
                  description: "View graphics jobs and order history",
                  icon: Palette,
                  color: "#FF9F43",
                  path: "#",
                  disabled: true,
                },
              ].map((service) => {
                return (
                  <ServiceCard key={service.id} service={service} />
                );
              })}
            </div>
          </div>
        </section>

        <section id="why" className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-semibold text-white">Why Choose NexGio</h2>
            <ul className="mt-4 text-[#A0A0A0] list-none space-y-2">
              <li>✔️ Affordable services</li>
              <li>✔️ Reliable and tested solutions</li>
              <li>✔️ Fast and responsive support</li>
              <li>✔️ Creative and modern designs</li>
            </ul>
          </div>
        </section>

        {/* Portfolio section removed per request */}

        <section id="announcements" className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-semibold text-white">Announcements</h2>
            <div className="mt-4 text-[#A0A0A0]">No announcements at the moment.</div>
          </div>
        </section>

        <section id="contact" className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-semibold text-white">Contact</h2>
            <div className="mt-4 text-[#A0A0A0] space-y-2">
              <div>📱 Phone: +63-952-458-9019</div>
              <div>💬 Facebook: <a href="https://facebook.com/nexgio.2.0" className="text-[#F5C400]">facebook.com/NexGio.2.0</a></div>
              <div>📧 Email: <a href="mailto:gioreptech@gmail.com" className="text-[#F5C400]">gioreptech@gmail.com</a></div>
              <div>📍 Location: Tuguegarao City, Cagayan</div>
              <div>📍 Location: Ballesteros, Cagayan</div>
              <div>📍 Location: Flora, Apayao</div>
            </div>
            <div className="mt-6">
              <a href="https://m.me/nexgio.2.0/" target="_blank" rel="noopener noreferrer" className="px-5 py-3 bg-[#F5C400] text-[#0F0F0F] rounded-md">Message Us Now</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div>
            <div className="text-lg font-bold">NexGio</div>
            <div className="text-sm text-gray-300">Where Connection Meets Creation.</div>
          </div>

          <div className="mt-4 md:mt-0 text-sm">
            <div className="mt-3 text-gray-400">© 2026 NexGio. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
function ServiceCard({ service }: { service: any }) {
  const Icon = service.icon as any;

  if (service.disabled) {
    return (
      <div
        className={`bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-8 transition-all opacity-50 cursor-not-allowed`}
      >
        <div className="mb-6">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, ${service.color}, ${service.color}CC)`,
              boxShadow: `0 10px 40px ${service.color}33`,
            }}
          >
            <Icon className="w-8 h-8 text-[#0F0F0F]" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-white">{service.name}</h3>
          <p className="text-[#A0A0A0] leading-relaxed">{service.description}</p>
        </div>

        <div className="mt-6">
          <div className="text-[#A0A0A0] text-sm font-medium">Coming Soon</div>
        </div>
      </div>
    );
  }

  return (
    <a
      href={service.path}
      className={`bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-8 transition-all hover:border-[#F5C400]/30 hover:scale-105 block`}
      style={{ cursor: "pointer", textDecoration: 'none' }}
    >
      <div className="mb-6">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
          style={{
            background: `linear-gradient(to bottom right, ${service.color}, ${service.color}CC)`,
            boxShadow: `0 10px 40px ${service.color}33`,
          }}
        >
          <Icon className="w-8 h-8 text-[#0F0F0F]" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-white">{service.name}</h3>
        <p className="text-[#A0A0A0] leading-relaxed">{service.description}</p>
      </div>

      <div className="mt-6">
        <span
          className="w-full inline-block text-center text-[#0F0F0F] font-semibold py-2 rounded-md"
          style={{ background: service.color, boxShadow: `0 4px 14px ${service.color}33`, cursor: 'pointer' }}
        >
          Access Portal
        </span>
      </div>
    </a>
  );
}
