# Visualize Impact Page

## Overview

The Visualize Impact page provides AI-powered visualization of users' environmental impact based on their pledges. It shows personalized climate forecasts, community impact, and sharing capabilities.

## Features

### 1. AI-Powered Climate Forecast

- **Personal CO₂ Projection**: Shows annual emissions with user's pledges
- **Baseline Comparison**: Displays what emissions would be without pledges
- **Total Savings**: Calculates CO₂ saved through pledged actions
- **Animated Numbers**: Smooth counting animations for better user experience

### 2. Annual Forecast Chart

- Interactive bar chart showing emissions trends from 2020-2031
- Dual visualization: baseline vs. with pledges
- Hover tooltips showing exact values
- Responsive design for mobile and desktop

### 3. Impact Breakdown by Pledge

- Individual pledge contribution visualization
- Progress bars showing relative impact
- Icons and titles for each pledge type
- Sorted by impact magnitude

### 4. Community Impact

- **Collective Footprint**: Shows total community savings
- **Member Count**: Displays active community members
- **Category Breakdown**: Transport, Energy, Diet, Water savings
- **Donut Chart**: Visual representation of savings by category

### 5. Share Your Impact

- **Social Sharing**: Twitter, LinkedIn integration
- **Image Export**: Save impact summary as image
- **Link Sharing**: Copy shareable link
- **Environmental Equivalents**: Trees planted, miles not driven, LED bulbs switched

### 6. Motivational Call-to-Action

- Inspirational quotes about environmental impact
- Personalized messaging based on user's pledges
- Direct link to pledge page for more actions

## Technical Implementation

### Data Sources

- User pledges from `apiClient.listUserPledges()`
- Pledge savings lookup table (`PLEDGE_SAVINGS_KG_YEAR`)
- Mock community data for demonstration

### Key Components

- `AnimatedNumber`: Smooth counting animation component
- Responsive grid layouts using Tailwind CSS
- SVG-based donut chart for category breakdown
- Custom CSS animations for enhanced UX

### Styling

- Gradient backgrounds (purple to blue to indigo)
- Glassmorphism effects with backdrop blur
- Floating background elements for visual appeal
- Consistent color scheme matching EcoPath brand

## User Experience

- **Loading States**: Graceful loading with skeleton UI
- **Empty States**: Helpful messaging when no pledges exist
- **Responsive Design**: Works on all device sizes
- **Accessibility**: Proper contrast ratios and semantic HTML

## Integration

- Integrated with existing EcoPath navigation
- Uses existing API client for pledge data
- Follows project's design system and color palette
- Compatible with SSR requirements

## Future Enhancements

- Real-time data updates
- More detailed forecasting algorithms
- Additional chart types
- Social media integration improvements
- Export to PDF functionality
