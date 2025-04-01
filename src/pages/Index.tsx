
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Navigation, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">PaddleRide</h1>
            <div className="space-x-4">
              <Link to="/login">
                <Button variant="outline" className="text-white border-white hover:bg-blue-700">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-white text-blue-600 hover:bg-blue-50">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Experience The River Like Never Before</h2>
            <p className="text-xl mb-8">Book a paddleboat delivered to your location. Enjoy the water, we handle the logistics.</p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-blue-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose Your Location</h3>
              <p className="text-gray-600">Select a zone on the map or use your current location to request a paddleboat.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-blue-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Book Your Trip</h3>
              <p className="text-gray-600">Schedule your paddleboat rental for a specific time or request immediate availability.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg shadow-md">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Navigation className="text-blue-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enjoy The Water</h3>
              <p className="text-gray-600">Our team delivers the boat to your location. When you're done, we'll pick it up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Hourly Rental</h3>
              <p className="text-4xl font-bold mb-6">$25<span className="text-base font-normal text-gray-600">/hour</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  <span>Minimum 1 hour rental</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  <span>Billed in 30-min increments after first hour</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  <span>Free delivery within standard zones</span>
                </li>
              </ul>
              <Link to="/signup">
                <Button className="w-full">Book Now</Button>
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md border-2 border-blue-500">
              <div className="bg-blue-500 text-white text-center text-sm font-medium py-1 px-3 rounded-full w-fit mx-auto mb-4">POPULAR</div>
              <h3 className="text-xl font-semibold mb-4">Half-Day Experience</h3>
              <p className="text-4xl font-bold mb-6">$90<span className="text-base font-normal text-gray-600">/4 hours</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  <span>4 consecutive hours of paddleboating</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  <span>Premium safety equipment included</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  <span>Free delivery to any zone</span>
                </li>
              </ul>
              <Link to="/signup">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Book Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">PaddleRide</h3>
              <p className="text-gray-400">Making paddleboating accessible and convenient across the river.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <address className="text-gray-400 not-italic">
                <p>123 River Road</p>
                <p>Ottawa, ON K1P 1J1</p>
                <p>Canada</p>
                <p className="mt-2">info@paddleride.com</p>
              </address>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} PaddleRide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
