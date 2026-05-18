import React from 'react'
import { Link } from 'react-router-dom'
import { BsBuilding, BsGeoAlt, BsHeart, BsPeople, BsBriefcase } from 'react-icons/bs'

export default function Landing() {
  console.log('Landing component rendering')
  try {
    return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#CB7246] via-[#F27C12] to-[#CB7246] text-white">
        <div className="max-w-6xl mx-auto px-6 py-32 text-center">
          <div className="absolute top-4 right-6">
            <Link to="/login" className="text-white/90 hover:text-white text-sm font-medium px-4 py-2 border border-white/30 rounded-lg hover:bg-white/20 transition">Staff Login</Link>
          </div>
          <h1 className="text-6xl font-bold mb-4 tracking-tight font-serif">Ubuntu Eco Lodge</h1>
          <p className="text-2xl text-white/90 max-w-2xl mx-auto mb-8 italic">"I am because we are."</p>
          <Link 
            to="/recruitment/jobs-board" 
            className="inline-block px-8 py-4 bg-white text-[#CB7246] rounded-full font-bold text-lg hover:bg-orange-100 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Job Opportunities
          </Link>
        </div>
      </div>

      {/* Transformation Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold font-serif text-[#373435] mb-6">The Transformation</h2>
              <p className="text-lg text-slate-600 mb-4">
                Through dedication, creativity, and deep collaboration with the local community, 
                the once-barren land has been transformed into a vibrant ecosystem—a haven of biodiversity, 
                sustainability, and cultural pride.
              </p>
              <p className="text-lg text-slate-600 mb-6">
                Ubuntu Eco Lodge harmoniously blends eco-friendly architecture, renewable energy, 
                and organic farming to create a space where people can live, learn, and heal in balance 
                with nature.
              </p>
              <p className="text-lg text-slate-600">
                It serves as a wellness and retreat center, offering peace and purpose for families, 
                corporates, and individuals seeking renewal and inspiration.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-2xl p-8 flex items-center justify-center">
              <div className="text-center">
                <BsGeoAlt size={64} className="text-[#CB7246] mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Sustainable Living</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-serif text-[#373435] mb-4">Ubuntu Eco Lodge: A Transformational Journey</h2>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Ubuntu Eco Lodge stands as a powerful testament to vision, resilience, and the spirit of community. 
              What began as a father's gift—a stretch of arid land in Kajiado from <strong>Isaac Oenga</strong> to his son 
              <strong> Elijah Oenga</strong>—has blossomed into a thriving ecological sanctuary.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Today, Ubuntu Eco Lodge is more than a destination; it is a living embodiment of the Ubuntu philosophy. 
              Here, we believe that our individual success is intrinsically linked to the well-being of our community 
              and the harmony of our environment.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-serif text-[#373435] mb-4">Our Values</h2>
            <p className="text-lg text-slate-600">The principles that guide everything we do</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#CB7246] to-[#F27C12] rounded-full flex items-center justify-center mx-auto mb-4">
                <BsPeople size={36} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#373435] mb-2">Ubuntu</h3>
              <p className="text-slate-600 text-sm">"I am because we are" - humanity towards others</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#2B6410] to-[#3a8318] rounded-full flex items-center justify-center mx-auto mb-4">
                <BsGeoAlt size={36} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#373435] mb-2">Sustainability</h3>
              <p className="text-slate-600 text-sm">Protecting our environment for future generations</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#CB7246] to-[#F27C12] rounded-full flex items-center justify-center mx-auto mb-4">
                <BsHeart size={36} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#373435] mb-2">Community</h3>
              <p className="text-slate-600 text-sm">Building meaningful connections and opportunities</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#373435] to-[#4a4a4a] rounded-full flex items-center justify-center mx-auto mb-4">
                <BsGeoAlt size={36} className="text-white" />
              </div>
              <h3 className="font-bold text-lg text-[#373435] mb-2">Authenticity</h3>
              <p className="text-slate-600 text-sm">Celebrating Kenyan culture and heritage</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#373435] text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center mb-6">
            <BsBriefcase size={48} className="text-[#CB7246]" />
          </div>
          <h2 className="text-4xl font-bold font-serif mb-4">Join Our Team</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Be part of our mission to create sustainable luxury experiences. Explore our current openings 
            and help us continue the transformation journey.
          </p>
          <Link 
            to="/recruitment/jobs-board" 
            className="inline-block px-8 py-4 bg-[#CB7246] text-white rounded-full font-bold text-lg hover:bg-[#F27C12] transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            View Job Opportunities
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#2B6410] text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold font-serif mb-4">Ubuntu Eco Lodge</h3>
              <p className="text-white/70 text-sm mb-4">A living embodiment of the Ubuntu philosophy in Kajiado, Kenya.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#CB7246]">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link to="/recruitment/jobs-board" className="hover:text-white transition">Job Opportunities</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Staff Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#CB7246]">Contact Us</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2"><BsGeoAlt size={16} /> Kajiado, Kenya</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[#CB7246]">Connect</h4>
              <p className="text-white/70 text-sm">Join our community and be part of the transformation.</p>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/50">
            <p>&copy; 2026 Ubuntu Eco Lodge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    )
  } catch (error) {
    console.error('Landing component error:', error)
    return <div>Error: {error.message}</div>
  }
}
