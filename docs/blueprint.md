# **App Name**: Ticketopia

## Core Features:

- Ticket Form: The primary form to create tickets.
- Ticket Fields: The fields available in the ticket form are: Customer Name, Issue Type, Notes, and Photo Upload placeholder.
- Address Autocomplete: Automatically fills address field using reverse-geocoding when available.
- Engineer ETA & Assignment: Presents available engineers in a dropdown, with ETA badges determined by distance, incorporating a tool to sort and filter for optimal engineer assignment.
- Ticket History: A history of recently created tickets including timestamps.
- Form Validation: Form validation using React Hook Form and Zod.
- Submission Modal: Post-submission confirmation modal with action buttons.

## Style Guidelines:

- Primary color: A warm, inviting blue (#4681C3), symbolizing trust and reliability, without being overtly corporate. Chosen for its balance and approachability in a service-oriented application.
- Background color: A light, desaturated blue-gray (#E8EBF2), creating a calm and professional backdrop. Provides enough contrast for readability, without drawing focus away from the primary elements.
- Accent color: A vibrant purple (#9B59B6) used sparingly for interactive elements like buttons and highlights. The deviation from the blue palette will call attention where necessary.
- Clean and readable typography optimized for form inputs and data display.
- Consistent use of icons to represent issue types and engineer specializations.
- The TicketForm is the prominent element of the page layout. The ticket history panel appears as a sidebar.