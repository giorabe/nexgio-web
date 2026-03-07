import { useEffect, useState } from "react";
import { Button } from "../../../../shared/ui/button";
import { Input } from "../../../../shared/ui/input";
import { Label } from "../../../../shared/ui/label";
import { User } from "lucide-react";
import { useAdminProfile } from "@/app/modules/internet/admin/hooks/useAdminProfile";
import useInternetSettings from "@/app/modules/internet/admin/hooks/useInternetSettings";

export default function Settings() {
  const { profile, loading, error, reload, saveProfile, changePassword } = useAdminProfile();

  const [profileForm, setProfileForm] = useState({ username: "", admin_full_name: "", email: "", admin_phone: "", admin_role: "" });
  const [profileStatus, setProfileStatus] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setProfileForm({ username: profile.username ?? "", admin_full_name: profile.admin_full_name ?? "", email: profile.email ?? "", admin_phone: profile.admin_phone ?? "", admin_role: profile.admin_role ?? "" });
    }
  }, [profile]);

  const { settings, draft, setDraft, save, resetDraft, isDirty, loading: loadingRemote, error: remoteError } = useInternetSettings();
  const [internetSaveStatus, setInternetSaveStatus] = useState<string | null>(null);
  const [view, setView] = useState<"profile" | "internet">("profile");

  // Password fields for changing password
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
      if (passwordForm.newPassword !== passwordForm.confirmPassword) throw new Error("New passwords do not match");
      if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) throw new Error("New password must be at least 6 characters");
      const res = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (!res.ok) throw new Error(res.error ?? "Unknown error");
      setPasswordStatus("changed");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordStatus(null), 2000);
    } catch (e: any) {
      setPasswordStatus(`error: ${e?.message ?? String(e)}`);
    }
  };

  

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <button onClick={() => setView("profile")} className={`px-4 py-2 rounded ${view === "profile" ? "bg-[#F5C400] text-black" : "bg-transparent text-[#A0A0A0] border border-[#2A2A2A]"}`}>Profile</button>
        <button onClick={() => setView("internet")} className={`px-4 py-2 rounded ${view === "internet" ? "bg-[#F5C400] text-black" : "bg-transparent text-[#A0A0A0] border border-[#2A2A2A]"}`}>Internet</button>
      </div>

      {view === "profile" && (
        <>
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

          {/* Change Password moved to its own card below */}

          <div className="flex items-center justify-end gap-3 pt-4">
            <div className="text-sm text-[#A0A0A0]">{profileStatus ?? ((profile == null && loading) ? "loading..." : "")}</div>
            <Button onClick={onSaveProfile} className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]">Save Profile Changes</Button>
          </div>
        </div>
      </div>
      
      <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-[#2B8AEB]/10">
            <User className="w-6 h-6 text-[#2B8AEB]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Change Password</h3>
            <p className="text-[#A0A0A0] text-sm">Update your account password</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, currentPassword: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
              <Input type="password" placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, newPassword: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
            <div className="mt-3">
              <Input type="password" placeholder="Retype new password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((s) => ({ ...s, confirmPassword: (e.target as HTMLInputElement).value }))} className="bg-[#161616] border-[#2A2A2A] text-white" />
            </div>
            <div className="text-sm text-[#A0A0A0]">{passwordStatus ?? ""}</div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button onClick={onChangePassword} className="bg-[#2B8AEB] hover:bg-[#2B8AEB]/90 text-white">Change Password</Button>
          </div>
        </div>
      </div>
        </>
      )}
      {view === "internet" && (
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-[#2B8AEB]/10">
              <User className="w-6 h-6 text-[#2B8AEB]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Internet Settings</h3>
              <p className="text-[#A0A0A0] text-sm">Provider account and billing configuration</p>
              <div className="text-sm text-[#A0A0A0] mt-2">{loadingRemote ? "Loading remote settings..." : (remoteError ? `Error loading remote settings: ${remoteError}` : "")}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Internet Provider</Label>
                <Input value={draft.providerName} onChange={(e) => setDraft({ ...draft, providerName: (e.target as HTMLInputElement).value })} className="bg-[#161616] border-[#2A2A2A] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Account Number</Label>
                <Input value={draft.accountNumber} onChange={(e) => setDraft({ ...draft, accountNumber: (e.target as HTMLInputElement).value })} className="bg-[#161616] border-[#2A2A2A] text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Due Day</Label>
                <Input type="number" min={1} max={31} value={String(draft.dueDay ?? 1)} onChange={(e) => setDraft({ ...draft, dueDay: Number((e.target as HTMLInputElement).value) })} className="bg-[#161616] border-[#2A2A2A] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Amount to Pay</Label>
                <Input type="number" value={String(draft.amount ?? "")} onChange={(e) => setDraft({ ...draft, amount: Number((e.target as HTMLInputElement).value) })} className="bg-[#161616] border-[#2A2A2A] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Plan</Label>
                <Input value={draft.plan} onChange={(e) => setDraft({ ...draft, plan: (e.target as HTMLInputElement).value })} className="bg-[#161616] border-[#2A2A2A] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Speed (Mbps)</Label>
                <Input type="number" min={0} value={String(draft.mbps ?? 0)} onChange={(e) => setDraft({ ...draft, mbps: Number((e.target as HTMLInputElement).value) })} className="bg-[#161616] border-[#2A2A2A] text-white" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <div className="text-sm text-[#A0A0A0] mr-3">{internetSaveStatus ?? (isDirty ? "Unsaved changes" : "")}</div>
              <Button onClick={async () => {
                try {
                  setInternetSaveStatus("saving");
                  const res = await save();
                  if (!res.ok) throw new Error(res.error ?? "Failed to save");
                  setInternetSaveStatus("saved");
                  setTimeout(() => setInternetSaveStatus(null), 2000);
                } catch (e: any) {
                  setInternetSaveStatus(`error: ${e?.message ?? String(e)}`);
                }
              }} className="bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#0F0F0F]">Save Internet Settings</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
