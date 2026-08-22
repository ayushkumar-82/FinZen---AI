# FinZen AI fixes

## AI chatbot
Set `GEMINI_API_KEY` in the server environment (for example `.env` locally). The key must stay server-side and must not be exposed through `VITE_...` variables.

The advisor uses Gemini 2.5 Flash and automatically includes the user's current salary, expenses, EMI, savings and goals in the prompt.

## Finance calculations
- Dashboard **Cash Left** = monthly salary - current-month logged expenses - existing EMI.
- Expense and goal entries update the shared finance store immediately and persist to localStorage.
- Expense lists are sorted by date so a newly entered expense appears at the top.
- Goal lists show newly created goals at the top.
- House planner continues to use the entered house price, down payment, interest, tenure, profile income/EMI/savings and actual logged expenses.
