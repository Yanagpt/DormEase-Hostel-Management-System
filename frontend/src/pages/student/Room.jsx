import { useEffect, useState } from 'react';
import { Building2, Users, Wifi, Wind, Tv, Refrigerator, Shirt, Bath, Star } from 'lucide-react';
import api from '../../api/axios';
import { PageHeader, Spinner, Badge } from '../../components/common/UI';

const AMENITY_ICONS = { ac: Wind, wifi: Wifi, tv: Tv, fridge: Refrigerator, wardrobe: Shirt, 'attached-bathroom': Bath };

export default function StudentRoom() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/student').then(r => setStudent(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const room = student?.room;

  if (!room) {
    return (
      <div>
        <PageHeader title="My Room" subtitle="Your hostel room information" />
        <div className="card p-12 text-center">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-600 mb-1">No Room Assigned</p>
          <p className="text-sm text-gray-400">Please contact the warden to get a room assignment.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Room" subtitle="Your room details and roommates" />

      <div className="grid grid-cols-3 gap-5">
        {/* Room Details */}
        <div className="col-span-2 space-y-4">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Building2 size={26} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Room {room.roomNumber}</h2>
                  <p className="text-gray-500 text-sm">Floor {room.floor} · Block {room.block}</p>
                </div>
              </div>
              <Badge label={room.status} variant={room.status} />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                ['Type', room.type?.charAt(0).toUpperCase() + room.type?.slice(1)],
                ['Capacity', `${room.capacity} beds`],
                ['Monthly Rent', `₹${room.monthlyRent?.toLocaleString()}`],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 font-semibold uppercase mb-1">{label}</p>
                  <p className="font-bold text-gray-900">{val}</p>
                </div>
              ))}
            </div>

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map(a => {
                    const Icon = AMENITY_ICONS[a] || Star;
                    return (
                      <div key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg text-indigo-700 text-xs font-semibold capitalize">
                        <Icon size={12} />
                        {a.replace('-', ' ')}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Occupancy */}
          <div className="card p-5">
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Occupancy</p>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500">Beds occupied</span>
                <span className="font-bold text-gray-900">{room.occupants?.length || 0}/{room.capacity}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${((room.occupants?.length || 0) / room.capacity) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Roommates */}
        <div className="card p-5">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">
            Roommates <span className="text-gray-500 font-normal">({(room.occupants?.length || 1) - 1})</span>
          </p>
          {!room.occupants || room.occupants.length <= 1 ? (
            <div className="text-center py-8">
              <Users size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No roommates yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {room.occupants.map(occ => (
                <div key={occ._id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {occ.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{occ.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{occ.rollNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
