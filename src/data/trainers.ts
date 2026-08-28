export type Trainer = {
  id: number | string;
  name: string;
  specialty: string;
  rating: number;
  clients: number;
  experience: string;
  price: number;
  image: string;
  tags: string[];
  bio: string;
  verified?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
  packages?: any[];
};

export const trainers: Trainer[] = [
  {
    id: 1,
    name: "Aryan Singh",
    specialty: "Strength & Powerlifting Coach",
    rating: 4.9,
    clients: 320,
    experience: "8 Years",
    price: 2499,
    image: "/images/trainers/aryan-singh.jpg",
    tags: ["Muscle Gain", "Strength", "Powerlifting", "CrossFit"],
    bio: "Certified Strength & Conditioning Specialist (CSCS) with 8+ years coaching competitive powerlifters and athletes. Specializes in biomechanics, heavy compound lifts, periodized progressive overload, and competition peak preparation.",
  },
  {
    id: 2,
    name: "Neha Sharma",
    specialty: "Fat Loss & Nutrition Specialist",
    rating: 4.8,
    clients: 280,
    experience: "6 Years",
    price: 1999,
    image: "/images/trainers/neha-sharma.jpg",
    tags: ["Weight Loss", "Nutrition", "Yoga"],
    bio: "Holistic weight loss expert and certified clinical sports nutritionist. Specializes in sustainable body fat reduction without restrictive dieting, metabolic recovery, and lifestyle habit transformation.",
  },
  {
    id: 3,
    name: "Rahul Mehta",
    specialty: "Bodybuilding & Hypertrophy Coach",
    rating: 5.0,
    clients: 500,
    experience: "10 Years",
    price: 2999,
    image: "/images/trainers/rahul-mehta.jpg",
    tags: ["Bodybuilding", "Muscle Gain", "Nutrition"],
    bio: "Former national physique competitor and hypertrophy specialist. Known for structured periodization, high-yield muscle hypertrophy protocols, contest prep, and precision nutrition programming.",
  },
  {
    id: 4,
    name: "Ananya Desai",
    specialty: "Yoga & Functional Mobility Specialist",
    rating: 4.9,
    clients: 210,
    experience: "7 Years",
    price: 1899,
    image: "/images/trainers/ananya-desai.jpg",
    tags: ["Yoga", "Weight Loss", "Nutrition"],
    bio: "Registered Yoga Teacher (RYT-500) and functional mobility specialist. Helps athletes and executives eliminate joint pain, improve deep hip and shoulder mobility, and build balanced core strength.",
  },
  {
    id: 5,
    name: "Vikram Malhotra",
    specialty: "CrossFit & High Intensity Coach",
    rating: 4.8,
    clients: 340,
    experience: "9 Years",
    price: 2799,
    image: "/images/trainers/vikram-malhotra.jpg",
    tags: ["CrossFit", "Strength", "Muscle Gain", "Powerlifting"],
    bio: "Level 3 CrossFit Trainer and athletic conditioning coach. Designs high-energy metabolic conditioning, Olympic weightlifting progressions, and functional endurance systems.",
  },
  {
    id: 6,
    name: "Karan Patel",
    specialty: "Calisthenics & Bodyweight Master",
    rating: 4.9,
    clients: 190,
    experience: "5 Years",
    price: 2199,
    image: "/images/trainers/karan-patel.jpg",
    tags: ["Calisthenics", "Muscle Gain", "Weight Loss"],
    bio: "Elite calisthenics instructor specializing in handstands, muscle-ups, levers, and gymnastic strength. Teaches progressive bodyweight progressions for all fitness backgrounds.",
  },
];