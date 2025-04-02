
import { Boat, Zone, Waiver } from '@/lib/supabase';

// Sample data for boats
export const boats: Partial<Boat>[] = [
  {
    boat_name: 'Paddle Fun 1',
    status: 'available',
    gps_device_id: 'GPS-001'
  },
  {
    boat_name: 'Paddle Fun 2',
    status: 'available',
    gps_device_id: 'GPS-002'
  },
  {
    boat_name: 'Paddle Fun 3',
    status: 'available',
    gps_device_id: 'GPS-003'
  },
  {
    boat_name: 'Paddle Fun 4',
    status: 'maintenance',
    gps_device_id: 'GPS-004'
  },
  {
    boat_name: 'Paddle Fun 5',
    status: 'available',
    gps_device_id: 'GPS-005'
  }
];

// Sample data for zones
export const zones: Partial<Zone>[] = [
  {
    zone_name: 'Downtown River',
    is_premium: true,
    description: 'Scenic downtown river route with city views'
  },
  {
    zone_name: 'Nature Reserve',
    is_premium: false,
    description: 'Peaceful paddling through the nature reserve'
  },
  {
    zone_name: 'Harbor Bay',
    is_premium: true,
    description: 'Experience the beautiful harbor bay area'
  },
  {
    zone_name: 'Lake Central',
    is_premium: false,
    description: 'Central lake with easy access points'
  }
];

// Sample data for waivers
export const waivers: Partial<Waiver>[] = [
  {
    version_label: 'v1.0',
    waiver_text: `
# Paddle Boat Rental Safety Waiver and Release of Liability

By accepting this waiver, I acknowledge the inherent risks of paddle boating and water activities. I understand that paddle boating involves risks including but not limited to:

1. Drowning or water-related injuries
2. Injuries from falling in or out of the boat
3. Collisions with other vessels, objects, or shorelines
4. Weather-related hazards
5. Physical exertion and potential medical emergencies

I hereby assume all risks associated with paddle boating activities. I confirm that I can swim and will wear a life jacket at all times while on the water. I agree to follow all safety instructions provided.

I release the Paddle Boat Rental Company, its owners, employees, and affiliates from all liability for any injury, loss, or damage connected with my use of the rental equipment, whether caused by negligence or otherwise.

I confirm that I am physically fit to participate in paddle boating and am not under the influence of alcohol or any substances that would impair my abilities.
    `
  }
];
