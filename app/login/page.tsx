"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import apiClient from "../api/apiClient";
import { useAuthenticate } from "@/app/context/AuthenticateContext";


export default function LoginPage() {
    const [form, setForm] = useState({ username: "", password: "" });
    const [isHovered, setIsHovered] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();
    const { isAuthenticated, refreshUser } = useAuthenticate();

    // if already authenticated (or session flag exists), redirect away from login
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasSession = !!(sessionStorage.getItem('session') || sessionStorage.getItem('user'));
            if (hasSession || isAuthenticated) {
                router.replace('/dashboard');
            }
        }
    }, [isAuthenticated, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        try {
            type LoginResponse = {
                success: boolean;
                message?: string;
                data?: {
                    user?: {
                        id: number;
                        username: string;
                        email: string;
                        name: string;
                        role: string;
                        isActive: boolean;
                        profilePicture?: string;
                    };
                    accessToken?: string;
                };
            };

            const res = await apiClient<LoginResponse>({
                url: "/api/auth/login",
                method: "POST",
                data: {
                    identifier: form.username,
                    password: form.password,
                },
                headers: {
                    "X-Client-Type": "web",
                },
            }) as LoginResponse;

            if (res && res.success) {
                if (typeof window !== "undefined" && res.data && res.data.user) {
                    sessionStorage.setItem("user", JSON.stringify(res.data.user));
                    try { sessionStorage.setItem('session', 'true'); } catch {}
                }
                
                // Refresh the authentication context to update isAuthenticated state
                await refreshUser();
                
                // Navigate to dashboard - context should now be updated
                router.replace("/dashboard");
            } else {
                setErrorMsg(res?.message || "Login failed");
            }
        } catch (err: unknown) {
            // Safely extract message from unknown
            let msg = "An unexpected error occurred";
            if (typeof err === 'object' && err !== null) {
                const e = err as Record<string, unknown>;
                if (typeof e['message'] === 'string') msg = e['message'] as string;
            }
            setErrorMsg(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-amber-50 px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Decorative Header */}
                <div className="relative h-24 bg-primary-color">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-2 rounded-full shadow-lg">
                            <img
                                src="/images/main.png"
                                alt="logo"
                                className="w-16 h-16 object-contain"
                            />
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-8 pt-8 space-y-4">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-1">Golden Future Institute</h1>
                        <p className="text-gray-500">Sign in to continue to your account</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <Label htmlFor="username" className="text-sm font-medium text-gray-700 mb-2 block">
                                Username or Email
                            </Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Enter your username or email"
                                value={form.username}
                                onChange={handleChange}
                                required
                                className="py-5 px-4 text-base rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="py-5 px-4 text-base rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <Link href="/forgot-password" className="text-xs text-primary-color hover:underline font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Button
                                type="submit"
                                className="w-full bg-primary-color hover:bg-blue-600 text-white font-bold py-5 rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden cursor-pointer select-none"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                            >
                                <span className="relative z-10">Login</span>
                                {isHovered && (
                                    <motion.div
                                        className="absolute inset-0 bg-white opacity-20"
                                        initial={{ x: "-100%" }}
                                        animate={{ x: "100%" }}
                                        transition={{ duration: 0.6 }}
                                    />
                                )}
                            </Button>
                        </motion.div>
                    </form>
                    {errorMsg && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMsg}</AlertDescription>
                        </Alert>
                    )}


                    <div className="text-center text-sm text-gray-500 pt-4">
                        Back to{" "}
                        <Link href="/" className="text-primary-color hover:underline font-semibold">
                            Homepage
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}