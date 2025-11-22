import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase/client";
import { getProfile } from "../utils/supabase/db";
import { Button } from "./ui/button";

interface ProfileProps {
  onBack: () => void;
}

export function Profile({ onBack }: ProfileProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('🔵 Profile: Loading profile from public.profiles...');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }
      
      const profile = await getProfile(user.id);
      
      if (!profile) {
        throw new Error('Profile not found');
      }
      
      console.log('✅ Profile: Profile loaded successfully:', profile);
      
      setName(profile.full_name || '');
      setEmail(profile.email || '');
      setCompany(profile.company || '');
    } catch (err: any) {
      console.error("❌ Profile: Error loading profile:", err);
      setError(err.message || 'Failed to load profile');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError("");
    setSuccess("");

    // Validate password change if attempting to change password
    if (newPassword) {
      if (!currentPassword) {
        setError("Please enter your current password");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Not authenticated');
      }
      
      // Update profile in public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          company: company,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileError) {
        throw profileError;
      }
      
      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (passwordError) {
          throw passwordError;
        }
      }
      
      setSuccess("Profile updated successfully!");
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[rgba(0,0,0,0.6)] hover:text-[#111111] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8">
          <h2 className="text-[#111111] mb-6">Profile Settings</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-[rgba(0,0,0,0.6)]">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-[12px] border-0 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                disabled={loading}
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[rgba(0,0,0,0.6)]">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                className="w-full px-4 py-3 bg-[rgba(0,0,0,0.03)] rounded-[12px] border-0 text-[rgba(0,0,0,0.4)] cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-[rgba(0,0,0,0.4)]">Email cannot be changed</p>
            </div>

            {/* Company Field */}
            <div className="space-y-2">
              <label htmlFor="company" className="block text-[rgba(0,0,0,0.6)]">
                Company
              </label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-[#F5F5F7] rounded-[12px] border-0 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                disabled={loading}
              />
            </div>

            {/* Password Change Section */}
            <div className="border-t border-[rgba(0,0,0,0.06)] pt-6 mt-6">
              <h3 className="text-[#111111] mb-4">Change Password</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="block text-[rgba(0,0,0,0.6)]">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F5F7] rounded-[12px] border-0 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-[rgba(0,0,0,0.6)]">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F5F7] rounded-[12px] border-0 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-[rgba(0,0,0,0.6)]">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F5F5F7] rounded-[12px] border-0 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#0071E3] transition-all"
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-[12px] p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[12px] px-8 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}