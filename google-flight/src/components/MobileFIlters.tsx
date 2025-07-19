// import React, { useState } from "react";
// import FlightFilters from "./FlightFilters";

// const MobileFilters: React.FC = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <>
//       {/* Mobile Filter Button */}
//       <button
//         onClick={() => setIsOpen(true)}
//         className="lg:hidden w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center space-x-2 mb-6"
//       >
//         <svg
//           className="w-5 h-5"
//           fill="none"
//           stroke="currentColor"
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             strokeWidth="2"
//             d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
//           />
//         </svg>
//         <span>Filters</span>
//       </button>

//       {/* Mobile Filter Modal */}
//       {isOpen && (
//         <div className="fixed inset-0 z-50 lg:hidden">
//           <div
//             className="absolute inset-0 bg-black bg-opacity-50"
//             onClick={() => setIsOpen(false)}
//           />
//           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-y-auto">
//             <div className="flex items-center justify-between p-4 border-b">
//               <h2 className="text-lg font-semibold">Filters</h2>
//               <button
//                 aria-label="Open"
//                 onClick={() => setIsOpen(false)}
//                 className="p-2 hover:bg-gray-100 rounded-lg"
//               >
//                 <svg
//                   className="w-5 h-5"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </button>
//             </div>
//             <div className="p-4">
//               <FlightFilters />
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };
// export default MobileFilters;
