import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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
    if (!client?.id) {
      toast.error("No client loaded", { duration: 3000, position: "top-right" });
      return;
    }
    setSavingProfile(true);
    try {
      const patch: any = {
        name: profileData.fullName,
        email: profileData.email,
        contact: profileData.phone,
      };
      const matcherField = client?.account_username ? { account_username: client.account_username } : { id: client.id };
      console.debug("[DEBUG] ClientSettings.update: matcher", matcherField, "patch", patch);
      let query = supabase.from("clients").update(patch);
      if (matcherField.account_username) query = query.eq("account_username", String(matcherField.account_username));
      else query = query.eq("id", matcherField.id);
      const { data, error } = await query.select();
      console.debug("[DEBUG] Supabase update result:", { data, error });
      if (error) throw new Error(error.message);
      if (!data || !Array.isArray(data) || data.length === 0) {
        toast.error("No row updated. Matcher used: " + JSON.stringify(matcherField), { duration: 3000, position: "top-right" });
        return;
      }
      const updated = data[0];
      setProfileData({ fullName: updated.name ?? profileData.fullName, email: updated.email ?? profileData.email, phone: updated.contact ?? profileData.phone });
      toast.success("Profile updated successfully", { duration: 3000, position: "top-right" });
      try { reload?.(); } catch {}
    } catch (err: any) {
      console.error("[DEBUG] updateClient failed", err);
      toast.error(err?.message ?? "Failed to update profile", { duration: 3000, position: "top-right" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) {
      toast.error("No client loaded", { duration: 3000, position: "top-right" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match!", { duration: 3000, position: "top-right" });
      return;
    }

    setChangingPassword(true);
    try {
      const identifier = client?.account_username ? { account_username: client.account_username } : { id: client.id };
      const payload = { identifier, newPassword: passwordData.newPassword };
      console.debug("[DEBUG] Sending password change request:", payload);
      const resp = await fetch("/api/client/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      let json: { error?: string; data?: any } = {};
      try {
        json = await resp.json();
      } catch (parseErr) {
        console.error("[DEBUG] Failed to parse JSON response", parseErr);
      }
      console.debug("[DEBUG] Password change response:", resp.status, json);
      if (!resp.ok) {
        toast.error("Password change failed: " + (json.error ?? resp.status), { duration: 4000, position: "top-right" });
        throw new Error(json.error ?? JSON.stringify(json));
      }
      if (!json.data) {
        toast.error("Password update failed: No data returned", { duration: 4000, position: "top-right" });
        throw new Error("Password update failed");
      }
      toast.success("Password changed successfully!", { duration: 3000, position: "top-right" });
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      console.error("[DEBUG] change password failed", err);
      toast.error(err?.message ?? "Failed to change password", { duration: 4000, position: "top-right" });
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
            <h2 className="text-xl font-bold text-white">Edit Password</h2>
            <p className="text-[#A0A0A0] text-sm">Directly edit your account password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
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
              {changingPassword ? "Updating..." : "Edit Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
