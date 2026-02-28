import React, { useEffect, useState } from "react";
import { User, Mail, Phone, Lock, Save } from "lucide-react";
import { Input } from "@/app/shared/ui/input";
import { Button } from "@/app/shared/ui/button";
import { useClientPortal } from "@/app/modules/internet/client/hooks/useClientPortal";
import { supabase } from "@/app/shared/supabaseClient";

export default function ClientSettings() {
  const { client, reload } = useClientPortal();

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setProfileData({
      fullName: client?.name ?? "",
      email: client?.email ?? "",
      phone: client?.contact ?? "",
    });
  }, [client]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client?.id) return alert("No client loaded");
    setSavingProfile(true);
    try {
      const patch: any = {
        name: profileData.fullName,
        email: profileData.email,
        contact: profileData.phone,
      };

      // Prefer updating by account_username (safer when id may be missing or numeric)
      const matcherField = client?.account_username ? { account_username: client.account_username } : { id: client.id };
      console.debug("ClientSettings.update: matcher", matcherField, "patch", patch);

      let query = supabase.from("clients").update(patch);
      if (matcherField.account_username) query = query.eq("account_username", String(matcherField.account_username));
      else query = query.eq("id", matcherField.id);

      // Use server endpoint (service role) to avoid client RLS blocking updates
      const identifier = client?.account_username ? { account_username: client.account_username } : { id: client.id };
      const resp = await fetch("/api/client/update-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, patch }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || JSON.stringify(json));
      const data = json.data;
      if (!data) throw new Error("No row updated");
      try {
        setProfileData({ fullName: data.name ?? profileData.fullName, email: data.email ?? profileData.email, phone: data.contact ?? profileData.phone });
      } catch {}
      alert("Profile updated successfully");
      try { reload?.(); } catch {}
    } catch (err: any) {
      console.error("updateClient failed", err);
      alert(err?.message ?? "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return alert("No client loaded");
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setChangingPassword(true);
    try {
      const username = client.account_username ?? client.account_username_str ?? "";
      // Call server endpoint to change password using service role key
      const identifier = client?.account_username ? { account_username: client.account_username } : { id: client.id };
      const resp = await fetch("/api/client/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier, currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || JSON.stringify(json));
      if (!json.data) throw new Error("Password update failed");
      alert("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      console.error("change password failed", err);
      alert(err?.message ?? "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Information */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-[#F5C400]/10 flex items-center justify-center">
            <User className="w-6 h-6 text-[#F5C400]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Profile Information</h2>
            <p className="text-[#A0A0A0] text-sm">Update your personal details</p>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-white">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                className="bg-[#161616] border-[#2A2A2A] text-white focus:border-[#F5C400]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-white">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="bg-[#161616] border-[#2A2A2A] text-white focus:border-[#F5C400] pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-white">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A0A0]" />
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="bg-[#161616] border-[#2A2A2A] text-white focus:border-[#F5C400] pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]" disabled={savingProfile}>
              <Save className="w-4 h-4 mr-2" />
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-[#F5C400]/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#F5C400]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Change Password</h2>
            <p className="text-[#A0A0A0] text-sm">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium text-white">
              Current Password
            </label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="bg-[#161616] border-[#2A2A2A] text-white focus:border-[#F5C400]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-white">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="bg-[#161616] border-[#2A2A2A] text-white focus:border-[#F5C400]"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="bg-[#161616] border-[#2A2A2A] text-white focus:border-[#F5C400]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]" disabled={changingPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
