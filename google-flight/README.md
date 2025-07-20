# ✈️ Google Flight Clone

A modern flight search application built with React and TypeScript that helps you find the best flight deals worldwide. This project replicates the core functionality of Google Flights with a clean, responsive interface.

![Flight Search Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Flight+Search+App)

## 🌟 What This App Does

- **Search for flights** between any two cities worldwide
- **View detailed flight information** including layovers and aircraft types
- **Switch between trip types** - round trip, one way, or multi-city
- **Responsive design** that works great on phones and desktops

## 🚀 Live Demo

[Check out the live app here](https://google-flight-clone-mu.vercel.app/) 

## 🛠️ Built With

- **React 18** - The main framework
- **TypeScript** - For better code quality and fewer bugs
- **Vite** - Super fast development and building
- **Tailwind CSS** - For styling without writing custom CSS
- **Axios** - For API calls
- **RapidAPI Sky Scrapper** - Real flight data source

## 📱 Features

### Core Functionality
- ✅ Real-time flight search with live pricing
- ✅ Airport autocomplete with city suggestions
- ✅ Multiple trip types (round-trip, one-way, multi-city)
- ✅ Passenger and cabin class selection
- ✅ Date picker with validation
- ✅ Comprehensive error handling

### User Experience
- ✅ Loading states and search progress
- ✅ Helpful error messages with suggestions
- ✅ Responsive design for all screen sizes
- ✅ Clean, intuitive interface
- ✅ Fast search results

### Technical Features
- ✅ TypeScript for type safety
- ✅ Context API for state management
- ✅ Custom hooks for reusable logic
- ✅ Debounced search inputs
- ✅ Proper error boundaries

## 🏃‍♂️ Getting Started

### What You'll Need

- Node.js (version 16 or higher)
- npm or yarn
- A RapidAPI account and key

### Installation

1. **Clone this repository**
  ```bash
  git clone https://github.com/yourusername/Google-Flight-Clone.git
  cd Google-Flight-Clone
  ```

2. **Install dependencies**
  ```bash
  npm install
  ```

3. **Set up your environment variables**
   
  Create a `.env` file in the root directory:
  ```env
  VITE_RAPIDAPI_KEY=your_rapidapi_key_here
  ```
   
  To get your API key:
  - Go to [RapidAPI](https://rapidapi.com/)
  - Sign up for a free account
  - Subscribe to the "Sky Scrapper" API
  - Copy your API key

4. **Start the development server**
  ```bash
  npm run dev
  ```

5. **Open your browser**
   
  Navigate to `http://localhost:5173` and start searching for flights!

## 📁 Project Structure

Here's how the code is organized:

```
src/
├── components/          # Reusable UI components
│   ├── AirportSelector.tsx
│   ├── FlightCard.tsx
│   ├── FlightResults.tsx
│   ├── Header.tsx
│   ├── RangeSlider.tsx
│   └── SearchForm.tsx
├── context/             # Global state management
│   └── FlightContext.tsx
├── hooks/               # Custom React hooks
│   ├── useAirportSearch.ts
│   ├── useDebounce.ts
│   └── useFlightSearch.ts
├── service/             # API integration
│   └── FlightService.ts
├── types/               # TypeScript type definitions
│   ├── Airport.ts
│   ├── FlightItinerary.ts
│   ├── FlightSearchParams.ts
│   ├── FlightSearchResponse.ts
│   ├── FlightSegment.ts
│   └── SearchFormData.ts
├── constant/            # App constants
│   └── ErrorMessages.ts
└── App.tsx             # Main app component
```

## 🔧 How It Works

### The Search Flow

1. **User types in airport names** → App searches for matching airports using the API
2. **User selects dates and options** → Form validates all inputs
3. **User clicks search** → App sends request to flight API
4. **API returns flight data** → App transforms and displays results
5. **User can filter results** → App updates display in real-time

### Key Components

- **SearchForm**: Handles all user inputs and form validation
- **AirportSelector**: Autocomplete dropdown for airport selection
- **FlightResults**: Displays search results with sorting and filtering
- **FlightCard**: Individual flight display with all details
- **FlightContext**: Manages global app state

## 🎨 Customization

Want to make it your own? Here are some easy customizations:

### Change Colors
Edit the Tailwind classes in components. For example, to change the primary color from blue to green:
```tsx
// Change this:
className="bg-blue-600 hover:bg-blue-700"
// To this:
className="bg-green-600 hover:bg-green-700"
```

### Add New Features
The code is structured to make adding features easy:
- Add new filters in `FlightContext.tsx`
- Create new components in the `components/` folder
- Add new API endpoints in `FlightService.ts`

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add your `VITE_RAPIDAPI_KEY` in Vercel's environment variables
4. Deploy!

### Deploy to Netlify

1. Build the project: `npm run build`
2. Upload the `dist` folder to [Netlify](https://netlify.com)
3. Set environment variables in Netlify's dashboard

## 🐛 Troubleshooting

### Common Issues

**"Invalid hook call" error**
- Make sure you're using React hooks only inside components
- Check that all components are properly wrapped in the FlightProvider

**API requests failing**
- Verify your RapidAPI key is correct
- Check that you have credits remaining on your RapidAPI account
- Make sure the environment variable name is exactly `VITE_RAPIDAPI_KEY`

**No search results**
- Try different airport codes (some routes have limited availability)
- Check that your search dates are in the future
- Verify the API is returning data in the browser's network tab

## 🤝 Contributing

Found a bug or want to add a feature? Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b my-new-feature`
3. Make your changes and test them
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin my-new-feature`
6. Submit a pull request

## 📝 What I Learned

Building this project taught me:
- How to work with complex API responses and transform data
- Managing state in larger React applications
- Building responsive UIs with Tailwind CSS
- Handling errors gracefully in user interfaces
- The importance of TypeScript in catching bugs early

## 🔮 Future Improvements

Ideas for making this even better:
- [ ] Add flight booking integration
- [ ] Implement price alerts and tracking
- [ ] Add user accounts and saved searches
- [ ] Include hotel and car rental suggestions
- [ ] Add a mobile app version
- [ ] Implement advanced filters (airline alliances, aircraft types)
- [ ] Add price history charts
- [ ] Include carbon footprint calculations

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

If you found this project helpful, please give it a ⭐ on GitHub!
