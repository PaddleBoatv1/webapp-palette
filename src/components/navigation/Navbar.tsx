
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, User, UserPlus, LogIn, LifeBuoy, Ship } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Ship className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-blue-600">PaddleRide</span>
            </Link>
            
            {user && (
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <Link to="/dashboard">
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  {user.role === 'customer' && (
                    <NavigationMenuItem>
                      <Link to="/create-reservation">
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Book Now
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  )}
                  
                  {user.role === 'admin' && (
                    <NavigationMenuItem>
                      <Link to="/admin">
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Admin Panel
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  )}
                  
                  {user.role === 'liaison' && (
                    <NavigationMenuItem>
                      <Link to="/liaison">
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Delivery Dashboard
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  )}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden md:inline text-gray-600">
                  {user.email}
                  {user?.role && (
                    <span className={`ml-2 px-2 py-1 ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : user.role === 'liaison' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                    } text-xs font-medium rounded-full`}>
                      {user.role === 'liaison' ? 'Delivery Executive' : user.role === 'admin' ? 'Admin' : 'Customer'}
                    </span>
                  )}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {location.pathname !== '/login' && (
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      <LogIn className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Login</span>
                    </Button>
                  </Link>
                )}
                {location.pathname !== '/signup' && (
                  <Link to="/signup">
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Sign Up</span>
                    </Button>
                  </Link>
                )}
                {location.pathname !== '/liaison-signup' && (
                  <Link to="/liaison-signup">
                    <Button variant="secondary" size="sm">
                      <LifeBuoy className="h-4 w-4 mr-2" />
                      <span className="hidden md:inline">Become a Delivery Executive</span>
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
