import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import img1 from './images/1.png';
import img2 from './images/2.png';
import img3 from './images/3.png';
import img4 from './images/4.png';
import img5 from './images/5.png';
import img6 from './images/6.png';
import img7 from './images/7.png';
import img8 from './images/8.png';

export function TutorialPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [showTutorial, setShowTutorial] = useState(true);
    const navigate = useNavigate();
    
    const tutorialSteps = [
        {
            title: "Home Page",
            content: "Quick access to your thermostat, alerts and events!",
            image: img1,
        },
        {
            title: "Rooms and Devices",
            content: "Here you can manage your rooms and their devices. You'll need the product code from your device's packaging.",
            image: img2,
        },
        {
            title: "Energy Statistics Page",
            content: "Check your real time usage and overall statistics. See what your predicted bills can be!",
            image: img3,
        },
        {
            title: "Ambiance Mode Page",
            content: "Set the mood for a study session or relaxation time, whatever you please!",
            image: img4,
        },
        {
            title: "Routines Page",
            content: "Automate daily tasks and save yourself the stress",
            image: img5,
        },
        {
            title: "Device Sharing Platform",
            content: "Participate in sharing and community building.",
            image: img6,
        },
        {
            title: "Guest Management Page",
            content: "Allow your friends and loved ones to access your devices.",
            image: img7,
        },
        {
            title: "Settings",
            content: "View your account info and recieve technical support.",
            image: img8,
        },
    ];

    const nextStep = () => {
        setCurrentStep(prev => (prev + 1) % tutorialSteps.length);
    };

    const prevStep = () => {
        setCurrentStep(prev => (prev - 1 + tutorialSteps.length) % tutorialSteps.length);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-[#262626] rounded-xl w-16/17 max-w-7xl relative h-6/7 flex flex-col">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-700">
                    <h1 className="text-2xl font-semibold text-[#8DA08E]">Tutorial</h1>
                </div>
                
                <div className="relative flex-1 overflow-hidden">
                    <button
                        onClick={prevStep}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#8DA08E] hover:bg-[#7A9580] text-white p-3 rounded-full  transition-colors z-10 shadow-lg"
                        disabled={currentStep === 0}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    
                    <button
                        onClick={nextStep}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#8DA08E] hover:bg-[#7A9580] text-white p-3 rounded-full transition-colors z-10 shadow-lg"
                        disabled={currentStep === tutorialSteps.length - 1}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    <div className="flex h-full transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${currentStep * 100}%)` }}
                    >
                        {tutorialSteps.map((step, index) => (
                            <div key={index} className="w-full flex-shrink-0 h-full flex flex-col px-8 py-6">
                                <div className="mb-4">
                                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                                    <p className="text-gray-300 text-sm mt-2">{step.content}</p>
                                </div>
                                <div className="flex-1 overflow-hidden rounded-lg flex items-center justify-center bg-black bg-opacity-20 p-2">
                                    <img 
                                        src={step.image}
                                        alt={step.title}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="px-8 py-5 flex justify-between items-center border-t border-gray-700">
                    <div className="text-gray-400">
                        Step {currentStep + 1} of {tutorialSteps.length}
                    </div>
                    {currentStep === tutorialSteps.length - 1 && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-[#8DA08E] hover:bg-[#7A9580] text-white px-8 py-2.5 rounded-lg hover-pulse font-medium"
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}