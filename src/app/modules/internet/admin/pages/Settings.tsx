import { useEffect, useState } from "react";
import { Button } from "../../../../shared/ui/button";
import { Input } from "../../../../shared/ui/input";
import { Label } from "../../../../shared/ui/label";
import { User } from "lucide-react";
import { useAdminProfile } from "@/app/modules/internet/admin/hooks/useAdminProfile";

export default function Settings() {
  const { profile, loading, error, reload, saveProfile, changePassword } = useAdminProfile();

  const [profileForm, setProfileForm] = useState({ username: "", admin_full_name: "", email: "", admin_phone: "", admin_role: "" });
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setProfileForm({ username: profile.username ?? "", admin_full_name: profile.admin_full_name ?? "", email: profile.email ?? "", admin_phone: profile.admin_phone ?? "", admin_role: profile.admin_role ?? "" });
    }
  }, [profile]);

  // Password fields
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const onSaveProfile = async () => {
    setProfileStatus("saving");
    try {
      const username = (profileForm.username ?? "").trim();
      if (!username) {
        setProfileStatus("error: Username is required");
        return;
      }
      const res = await saveProfile({ username: username, admin_full_name: profileForm.admin_full_name, admin_phone: profileForm.admin_phone, admin_role: profileForm.admin_role, email: profileForm.email });
      if (!res.ok) throw new Error(res.error ?? "Unknown error");
      setProfileStatus("saved");
      setTimeout(() => setProfileStatus(null), 2000);
    } catch (e: any) {
      setProfileStatus(`error: ${e?.message ?? String(e)}`);
    }
  };

  const onChangePassword = async () => {
    setPasswordStatus("saving");
    try {
      if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) throw new Error("New password must be at least 6 characters");
      const res = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (!res.ok) throw new Error(res.error ?? "Unknown error");
      setPasswordStatus("changed");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setTimeout(() => setPasswordStatus(null), 2000);
    } catch (e: any) {
      setPasswordStatus(`error: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-[#F5C400]/10">
            <User className="w-6 h-6 text-[#F5C400]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Admin Profile Settings</h3>
            <p className="text-[#A0A0A0] text-sm">Manage your account information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Full Name</Label>
              <Input value={profileForm.admin_full_name} onChange={(e) => setProfileForm((s) => ({ ...s, admin_full_name: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Username</Label>
              <Input value={profileForm.username} onChange={(e) => setProfileForm((s) => ({ ...s, username: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Email Address</Label>
              <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm((s) => ({ ...s, email: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Phone Number</Label>
              <Input value={profileForm.admin_phone} onChange={(e) => setProfileForm((s) => ({ ...s, admin_phone: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Role</Label>
              <Input value={profileForm.admin_role} readOnly className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Change Password</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
              <Input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <div className="text-sm text-[#A0A0A0]">{profileStatus ?? passwordStatus ?? (loading ? "loading..." : "")}</div>
            <Button onClick={onSaveProfile} className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]">Save Profile Changes</Button>
            <Button onClick={onChangePassword} className="bg-[#2B8AEB] hover:bg-[#2B8AEB]/90 text-white">Change Password</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
