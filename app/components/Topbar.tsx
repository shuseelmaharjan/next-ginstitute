import { FaEnvelope, FaPhone } from "react-icons/fa";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaArrowRight } from "react-icons/fa";
import { FaUser } from "react-icons/fa";

export default function Topbar() {
    return (
        <div className="bg-primary-color py-1 top-0 left-0 right-0 h-auto z-40">
            <div className="max-w-7xl mx-auto flex justify-end md:justify-between items-center h-full px-4">
                <div className="hidden md:flex items-center space-x-6 text-white font-normal">
                    <span className="flex items-center">
                        <FaPhone className="h-4 w-4" />
                        <a href="tel:+97701-5108166" className="hover:underline ml-2">01-5108166</a>,
                        <a href="tel:+977-9813940696" className="hover:underline ml-2">9813940696</a>
                    </span>
                    <span className="flex items-center space-x-2">
                        <FaEnvelope className="h-4 w-4" />
                        <a href="mailto:goldenfutureinstitute1@gmail.com" className="hover:underline">goldenfutureinstitute1@gmail.com</a>
                    </span>

                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/apply" className="w-full">
                        <Button
                            size="sm"
                            className="group border-orange-400 text-white bg-orange-400 hover:bg-orange-500 font-semibold px-4 py-1 rounded hidden md:inline-flex items-center transition-all duration-200"
                        >
                            Apply Online
                            <FaArrowRight className="ml-1 transform transition-transform duration-200 group-hover:translate-x-1" />
                        </Button>

                        <div className="flex justify-end w-full md:hidden">
                            <Button
                                size="sm"
                                className="group border-orange-400 text-white bg-orange-400 hover:bg-orange-500 font-semibold px-4 py-1 rounded inline-flex items-center transition-all duration-200"
                            >
                                Apply Online
                                <FaArrowRight className="ml-1 transform transition-transform duration-200 group-hover:translate-x-1" />
                            </Button>
                        </div>


                    </Link>
                    <Link href="/login" className="w-full">
                        <Button
                            size="sm"
                            className="border-orange-400 text-white bg-orange-400 hover:bg-orange-500 font-semibold px-4 py-1 rounded hidden md:inline-flex"
                        >
                            <FaUser className="mr-1" />
                            Login
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}