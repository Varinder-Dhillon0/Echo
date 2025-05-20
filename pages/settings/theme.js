import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../utils/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { HexColorPicker } from "react-colorful";
import { RiVipCrownFill } from "react-icons/ri";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ThemeSettings() {
  const [user, loading] = useAuthState(auth);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState({
    primary: "#3B82F6",
    secondary: "#2563EB",
    background: "#FFFFFF",
    text: "#000000",
    banner: "#4F46E5",
    bannerText: "#FFFFFF",
    profileBorder: "#3B82F6",
    profileBorderWidth: "4",
    profileBorderStyle: "solid"
  });
  const [activeColor, setActiveColor] = useState(null);
  const router = useRouter();

  const borderStyles = [
    { value: "solid", label: "Solid" },
    { value: "dashed", label: "Dashed" },
    { value: "dotted", label: "Dotted" },
    { value: "double", label: "Double" }
  ];

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsPremium(userData.isPremium || false);
          if (userData.customTheme) {
            setTheme(prev => ({
              ...prev,
              ...userData.customTheme
            }));
          }
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  // Handle authentication state
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const handleSave = async () => {
    if (!user || !isPremium) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        customTheme: theme,
      });

      toast.success("Theme updated successfully!", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Error updating theme:", error);
      toast.error("Failed to update theme", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  if (loading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-1/4 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <RiVipCrownFill className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            Custom themes are available exclusively for premium members.
          </p>
          <button
            onClick={() => router.push("/premium")}
            className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-full hover:bg-blue-600 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Customize Theme</h1>

          <Tabs defaultValue="colors" className="space-y-6">
            <TabsList>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-6">
              {/* Basic Colors */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Basic Colors</h2>
                {Object.entries(theme)
                  .filter(([key]) => ["primary", "secondary", "background", "text"].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="block text-sm font-medium capitalize">
                        {key} Color
                      </Label>
                      <div className="flex items-center gap-4">
                        <button
                          className="w-10 h-10 rounded-lg border shadow-sm"
                          style={{ backgroundColor: value }}
                          onClick={() => setActiveColor(activeColor === key ? null : key)}
                        />
                        <Input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setTheme((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          className="flex-1"
                        />
                      </div>
                      {activeColor === key && (
                        <div className="absolute z-10 mt-2">
                          <HexColorPicker
                            color={value}
                            onChange={(newColor) =>
                              setTheme((prev) => ({ ...prev, [key]: newColor }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              {/* Banner Settings */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Banner Settings</h2>
                <div className="space-y-2">
                  <Label>Banner Color</Label>
                  <div className="flex items-center gap-4">
                    <button
                      className="w-10 h-10 rounded-lg border shadow-sm"
                      style={{ backgroundColor: theme.banner }}
                      onClick={() => setActiveColor(activeColor === "banner" ? null : "banner")}
                    />
                    <Input
                      type="text"
                      value={theme.banner}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, banner: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                  {activeColor === "banner" && (
                    <div className="absolute z-10 mt-2">
                      <HexColorPicker
                        color={theme.banner}
                        onChange={(newColor) =>
                          setTheme((prev) => ({ ...prev, banner: newColor }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Banner Text Color</Label>
                  <div className="flex items-center gap-4">
                    <button
                      className="w-10 h-10 rounded-lg border shadow-sm"
                      style={{ backgroundColor: theme.bannerText }}
                      onClick={() => setActiveColor(activeColor === "bannerText" ? null : "bannerText")}
                    />
                    <Input
                      type="text"
                      value={theme.bannerText}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, bannerText: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                  {activeColor === "bannerText" && (
                    <div className="absolute z-10 mt-2">
                      <HexColorPicker
                        color={theme.bannerText}
                        onChange={(newColor) =>
                          setTheme((prev) => ({ ...prev, bannerText: newColor }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Border Settings */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Profile Border Settings</h2>
                <div className="space-y-2">
                  <Label>Border Color</Label>
                  <div className="flex items-center gap-4">
                    <button
                      className="w-10 h-10 rounded-lg border shadow-sm"
                      style={{ backgroundColor: theme.profileBorder }}
                      onClick={() => setActiveColor(activeColor === "profileBorder" ? null : "profileBorder")}
                    />
                    <Input
                      type="text"
                      value={theme.profileBorder}
                      onChange={(e) =>
                        setTheme((prev) => ({ ...prev, profileBorder: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                  {activeColor === "profileBorder" && (
                    <div className="absolute z-10 mt-2">
                      <HexColorPicker
                        color={theme.profileBorder}
                        onChange={(newColor) =>
                          setTheme((prev) => ({ ...prev, profileBorder: newColor }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Border Width (px)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={theme.profileBorderWidth}
                    onChange={(e) =>
                      setTheme((prev) => ({ ...prev, profileBorderWidth: e.target.value }))
                    }
                    className="flex-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Border Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {borderStyles.map((style) => (
                      <button
                        key={style.value}
                        className={`p-2 border rounded-lg text-sm ${
                          theme.profileBorderStyle === style.value
                            ? "bg-blue-50 border-blue-500 text-blue-700"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() =>
                          setTheme((prev) => ({ ...prev, profileBorderStyle: style.value }))
                        }
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              {/* Preview Section */}
              <div className="border rounded-xl overflow-hidden">
                {/* Banner Preview */}
                <div
                  className="h-32 relative"
                  style={{ backgroundColor: theme.banner }}
                >
                  <h2
                    className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
                    style={{ color: theme.bannerText }}
                  >
                    Profile Banner
                  </h2>
                </div>

                {/* Profile Picture Preview */}
                <div className="px-6 -mt-12 relative">
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden relative"
                    style={{
                      borderWidth: `${theme.profileBorderWidth}px`,
                      borderStyle: theme.profileBorderStyle,
                      borderColor: theme.profileBorder
                    }}
                  >
                    <img
                      src={user?.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content Preview */}
                <div className="p-6">
                  <div className="space-y-4">
                    <button
                      className="px-4 py-2 rounded-lg text-white w-full"
                      style={{ backgroundColor: theme.primary }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-white w-full"
                      style={{ backgroundColor: theme.secondary }}
                    >
                      Secondary Button
                    </button>
                    <p style={{ color: theme.text }}>
                      Sample text with custom color
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 