export const mockDoctors = [
  {
    id: "doc_1",
    name: "Dr. Ananya Iyer",
    department: "Cardiology",
    specialization: "Interventional Cardiology",
    rating: 4.7,
    serviceRate: 12,
    predictedWaitMins: 22,
    isEmergencyCapable: true,
    nextSlotLabel: "Today 4:30 PM",
  },
  {
    id: "doc_2",
    name: "Dr. Rohan Mehta",
    department: "General Medicine",
    specialization: "Internal Medicine",
    rating: 4.5,
    serviceRate: 20,
    predictedWaitMins: 14,
    isEmergencyCapable: true,
    nextSlotLabel: "Today 3:50 PM",
  },
  {
    id: "doc_3",
    name: "Dr. Pooja Nair",
    department: "Dermatology",
    specialization: "Clinical Dermatology",
    rating: 4.6,
    serviceRate: 18,
    predictedWaitMins: 36,
    isEmergencyCapable: false,
    nextSlotLabel: "Tomorrow 10:20 AM",
  },
  {
    id: "doc_4",
    name: "Dr. Arjun Singh",
    department: "Pulmonology",
    specialization: "Respiratory Medicine",
    rating: 4.4,
    serviceRate: 15,
    predictedWaitMins: 18,
    isEmergencyCapable: true,
    nextSlotLabel: "Today 5:10 PM",
  },
  {
    id: "doc_5",
    name: "Dr. Kavya Reddy",
    department: "Pediatrics",
    specialization: "Child Health",
    rating: 4.8,
    serviceRate: 17,
    predictedWaitMins: 28,
    isEmergencyCapable: false,
    nextSlotLabel: "Today 6:00 PM",
  },
];

export const mockQueue = {
  doctorName: "Dr. Rohan Mehta",
  department: "General Medicine",
  slotLabel: "Today 3:00 PM – 6:00 PM",
  currentToken: 12,
  entries: [
    { tokenNo: 12, name: "Suresh Kumar", status: "CALLED", priority: "NORMAL" },
    { tokenNo: 13, name: "Ayesha Khan", status: "WAITING", priority: "EMERGENCY" },
    { tokenNo: 14, name: "Priya Sharma", status: "WAITING", priority: "NORMAL" },
    { tokenNo: 15, name: "Nitin Patil", status: "WAITING", priority: "SENIOR" },
    { tokenNo: 16, name: "Karthik Raj", status: "WAITING", priority: "NORMAL" },
    { tokenNo: 17, name: "Neha Gupta", status: "NO_SHOW", priority: "NORMAL" },
  ],
};

export const mockAppointments = {
  upcoming: [
    {
      id: "apt_1",
      doctorName: "Dr. Arjun Singh",
      department: "Pulmonology",
      when: "Today 5:10 PM",
      status: "BOOKED",
    },
    {
      id: "apt_2",
      doctorName: "Dr. Ananya Iyer",
      department: "Cardiology",
      when: "Tomorrow 11:40 AM",
      status: "BOOKED",
    },
  ],
  history: [
    {
      id: "apt_0",
      doctorName: "Dr. Pooja Nair",
      department: "Dermatology",
      when: "Last week",
      status: "COMPLETED",
    },
  ],
};

