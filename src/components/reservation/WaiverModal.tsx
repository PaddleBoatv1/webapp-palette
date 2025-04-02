
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Waiver } from "@/lib/supabase";

interface WaiverModalProps {
  waiver: Waiver;
  onAccept: () => void;
  onCancel: () => void;
}

const WaiverModal = ({ waiver, onAccept, onCancel }: WaiverModalProps) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [open, setOpen] = useState(true);

  const handleAccept = () => {
    onAccept();
    setOpen(false);
  };

  const handleCancel = () => {
    onCancel();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Safety Waiver & Agreement</DialogTitle>
          <DialogDescription>
            You must agree to our terms and safety requirements before booking.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[300px] w-full rounded-md border p-4 my-4">
          <div className="text-sm">
            <h3 className="font-bold mb-2">{waiver.version_label}</h3>
            <div dangerouslySetInnerHTML={{ __html: waiver.waiver_text }} />
          </div>
        </ScrollArea>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="accept-waiver" 
            checked={hasAgreed}
            onCheckedChange={(checked) => setHasAgreed(!!checked)} 
          />
          <label
            htmlFor="accept-waiver"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and agree to the waiver terms and safety requirements
          </label>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleAccept}
            disabled={!hasAgreed}
          >
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WaiverModal;
