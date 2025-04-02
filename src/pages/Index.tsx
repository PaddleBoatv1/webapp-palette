
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, LogIn, Ship, UserPlus, MapPin } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-extrabold mb-6">Experience the Water Your Way</h1>
            <p className="text-xl mb-8">
              Book a paddleboat on-demand, delivered right to your waterfront location. 
              Enjoy your time on the water and we'll handle the rest.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                  Sign Up Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Log In <LogIn className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How PaddleRide Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Choose Your Location</h3>
              <p className="text-gray-600">
                Select your starting point along the water, and we'll deliver a paddleboat to you.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Ship className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enjoy Your Ride</h3>
              <p className="text-gray-600">
                Paddle at your own pace. No need to worry about returning to a specific dock.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                <ArrowRight className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">We Handle the Rest</h3>
              <p className="text-gray-600">
                When you're done, we'll pick up the boat from your end location. Simple!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Join Our Team Section */}
      <div className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Join Our Team</h2>
            <p className="text-lg text-gray-700 mb-8">
              Become a delivery executive and help us deliver paddleboats to our customers. 
              Flexible hours and competitive pay.
            </p>
            <Link to="/liaison-signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="mr-2 h-5 w-5" />
                Become a Delivery Executive
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4">PaddleRide</h3>
              <p className="text-gray-400 max-w-xs">
                Bringing the joy of paddleboating to you, wherever you are on the water.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 md:gap-20">
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/signup" className="text-gray-400 hover:text-white">Sign Up</Link></li>
                  <li><Link to="/login" className="text-gray-400 hover:text-white">Log In</Link></li>
                  <li><Link to="/liaison-signup" className="text-gray-400 hover:text-white">Become a Delivery Executive</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} PaddleRide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
