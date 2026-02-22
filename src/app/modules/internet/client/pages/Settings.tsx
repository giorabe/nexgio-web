import React, { useEffect, useState } from "react";
import { getProfile, patchProfile } from "../services/client.service";

export default function ClientSettings() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then((r) => {
      setProfile(r.data);
      setLoading(false);
    });
  }, []);

  async function save() {
    setStatus(null);
    const payload = {
      name: profile.name,
      email: profile.email,
      contact: profile.contact,
      account_username: profile.account_username,
      account_password: profile.account_password,
    };
    const res = await patchProfile(payload);
    if (res?.data) setStatus("Saved successfully");
    else setStatus("Error saving");
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-xl">
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>
        <div className="bg-[#0B0B0B] border border-[#222] rounded p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-300">Room Number (read-only)</label>
            <div className="mt-1 p-2 bg-[#0b0b0b] border border-[#222] rounded">{profile.room || "—"}</div>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm text-gray-300">Full Name</label>
            <input id="fullName" name="name" value={profile.name||""} onChange={(e)=>setProfile({...profile, name: e.target.value})} className="w-full mt-1 p-2 rounded bg-[#111] border border-[#222]" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-300">Email</label>
            <input id="email" name="email" value={profile.email||""} onChange={(e)=>setProfile({...profile, email: e.target.value})} className="w-full mt-1 p-2 rounded bg-[#111] border border-[#222]" />
          </div>

          <div>
            <label htmlFor="contact" className="block text-sm text-gray-300">Contact Number</label>
            <input id="contact" name="contact" value={profile.contact||""} onChange={(e)=>setProfile({...profile, contact: e.target.value})} className="w-full mt-1 p-2 rounded bg-[#111] border border-[#222]" />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm text-gray-300">Username</label>
            <input id="username" name="account_username" value={profile.account_username||""} onChange={(e)=>setProfile({...profile, account_username: e.target.value})} className="w-full mt-1 p-2 rounded bg-[#111] border border-[#222]" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-300">Password</label>
            <input id="password" name="account_password" type="password" value={profile.account_password||""} onChange={(e)=>setProfile({...profile, account_password: e.target.value})} className="w-full mt-1 p-2 rounded bg-[#111] border border-[#222]" />
          </div>

          {status && <div className="text-green-400">{status}</div>}

          <div>
            <button onClick={save} className="py-2 px-4 bg-[#F5C400] text-black rounded">Save</button>
          </div>
        </div>
      </div>
  );
}
