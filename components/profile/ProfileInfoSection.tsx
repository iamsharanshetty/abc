"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UpdateAvatarModal } from "@/components/profile/UpdateAvatarModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

export function ProfileInfoSection() {
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Side: Photo & Actions */}
                <div className="w-full md:w-[240px] flex-shrink-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Profile Info</h3>

                    <div className="flex flex-col items-start">
                        <div className="h-32 w-32 rounded-full border-4 border-slate-100 dark:border-slate-800 overflow-hidden mb-6 relative">
                            {/* Placeholder for Profile - using a dicebear seed or placeholder image */}
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <Button
                            variant="outline"
                            className="w-[100px] border-slate-200 text-slate-900 font-bold h-9 bg-white hover:bg-slate-50 mb-3 rounded-lg text-xs dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
                            onClick={() => setIsAvatarModalOpen(true)}
                        >
                            Change
                        </Button>

                        <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors ml-4 mb-8 dark:text-slate-400 dark:hover:text-slate-200">
                            Remove
                        </button>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Login & Security</h3>
                            <button
                                className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                                onClick={() => setIsPasswordModalOpen(true)}
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Full Name</label>
                            <Input
                                defaultValue="John Doe"
                                className="bg-white border-slate-200 h-10 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Email</label>
                            <Input
                                defaultValue="john@company.com"
                                className="bg-white border-slate-200 h-10 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-0 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 max-w-[calc(50%-12px)]"> {/* Half width matching the grid above */}
                        <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Role</label>
                        <Select defaultValue="admin">
                            <SelectTrigger className="w-full h-10 border-slate-200 text-slate-700 font-medium">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <UpdateAvatarModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} />
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </>
    );
}
