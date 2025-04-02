
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateReservation, useGetZones, useGetLatestWaiver, useAcceptWaiver } from "@/hooks/useDatabase";
import ReservationForm from "@/components/reservation/ReservationForm";
import ZonePicker from "@/components/reservation/ZonePicker";
import WaiverModal from "@/components/reservation/WaiverModal";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Steps, Step } from "@/components/ui/steps";
import { Loader2 } from "lucide-react";

const CreateReservation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showWaiver, setShowWaiver] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date(),
    isImmediate: false,
    startZoneId: "",
    endZoneId: "",
    estimatedCost: 0
  });

  const { mutate: createReservation, isPending } = useCreateReservation();
  const { data: zones, isLoading: isLoadingZones } = useGetZones();
  const { data: latestWaiver } = useGetLatestWaiver();
  const { mutate: acceptWaiver } = useAcceptWaiver();

  const handleFormSubmit = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleZoneSelection = (startZoneId: string, endZoneId: string) => {
    setFormData((prev) => ({ ...prev, startZoneId, endZoneId }));
    
    // Check if user has accepted waiver
    if (latestWaiver) {
      setShowWaiver(true);
    } else {
      handleSubmitReservation();
    }
  };

  const handleAcceptWaiver = () => {
    if (!user?.id || !latestWaiver) return;
    
    acceptWaiver({
      user_id: user.id,
      waiver_id: latestWaiver.id,
      accepted_at: new Date().toISOString()
    });
    
    setShowWaiver(false);
    handleSubmitReservation();
  };

  const handleSubmitReservation = () => {
    if (!user?.id) return;
    
    const reservation = {
      user_id: user.id,
      status: 'pending',
      start_zone_id: formData.startZoneId,
      end_zone_id: formData.endZoneId,
      start_time: formData.isImmediate ? new Date().toISOString() : formData.date.toISOString(),
      estimated_cost: formData.estimatedCost
    };
    
    createReservation(reservation, {
      onSuccess: () => {
        toast({
          title: "Reservation Created",
          description: "Your reservation has been successfully created. Awaiting boat assignment."
        });
        navigate("/dashboard");
      }
    });
  };

  if (isLoadingZones) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create Paddleboat Reservation</CardTitle>
          <CardDescription>Plan your paddleboat adventure in just a few steps</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Steps currentStep={currentStep} className="mb-8">
            <Step title="Trip Details" description="Select date and time" />
            <Step title="Pick Locations" description="Select start and end zones" />
            <Step title="Confirmation" description="Review and confirm" />
          </Steps>
          
          {currentStep === 0 && (
            <ReservationForm onSubmit={handleFormSubmit} />
          )}
          
          {currentStep === 1 && zones && (
            <ZonePicker 
              zones={zones} 
              onSelect={handleZoneSelection}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            >
              Back
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {showWaiver && latestWaiver && (
        <WaiverModal 
          waiver={latestWaiver} 
          onAccept={handleAcceptWaiver}
          onCancel={() => setShowWaiver(false)}
        />
      )}
    </div>
  );
};

export default CreateReservation;
