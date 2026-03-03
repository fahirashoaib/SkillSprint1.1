import mongoose from 'mongoose';
import Course from './models/Course.js';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const sampleCourses = [
  {
    courseId: "0",
    title: "Arrays",
    category: "Computational",
    difficulty: "Beginner",
    totalDuration: 60,
    totalXP: 240,
    learningObjectives: [
      "Learn how to define arrays",
      "Understand memory for arrays",
      "Learn about array methods",
      "How much time an array method takes",
      "How to search and sort in arrays",
      "Solve problems using arrays"
    ],
    units: [
      {
        unitId: "unit1",
        title: "Array Basics",
        duration: 12,
        totalXP: 45,
        displayMessage: "Let's learn about arrays! Start now!",
        screens: [
          {
            screenId: "screen1",
            title: "What is an Array?",
            description: "An array stores multiple values like a row of lockers!",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Quick Check",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "An array is like:",
                type: "mcq",
                options: ["A single box", "A row of lockers", "A computer", "A number"],
                correctAnswer: "A row of lockers",
                explanation: "Array holds multiple items together",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen3",
            title: "Data Types",
            description: "Different types of data:\nint - whole numbers\nchar - letters\nfloat - decimal numbers",
            type: "content"
          },
          {
            screenId: "screen4",
            title: "Type Practice",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Which one stores letters?",
                type: "mcq",
                options: ["int", "char", "float", "double"],
                correctAnswer: "char",
                explanation: "char stores characters like 'A', 'b', 'c'",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen5",
            title: "Creating an array",
            description: "int scores[5];\n5 lockers for scores",
            type: "content",
            codeExample: "int scores[5];"
          },
          {
            screenId: "screen6",
            title: "Array with Values",
            description: "Add values to lockers:",
            type: "content",
            codeExample: "int scores[3] = {95, 87, 92};"
          },
          {
            screenId: "screen7",
            title: "Practice array creation",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Make an array for 3 ages",
                type: "coding",
                correctAnswer: "int ages[3] = {20, 21, 19};",
                explanation: "An age array has size 3 with 3 age numbers",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen8",
            title: "Memory Size",
            description: "Total memory = items × size per item",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Memory size Example",
            description: "int numbers[4];\n4 × 4 bytes = 16 bytes",
            type: "content",
            codeExample: "int numbers[4]; // 16 bytes"
          },
          {
            screenId: "screen10",
            title: "Memory Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "char letters[5] uses:",
                type: "mcq",
                options: ["5 bytes", "10 bytes", "20 bytes", "1 byte"],
                correctAnswer: "5 bytes",
                explanation: "5 chars × 1 byte each = 5 bytes",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen11",
            title: "Counting Items",
            description: "Number of items:\nTotal bytes ÷ size per item",
            type: "content"
          },
          {
            screenId: "screen12",
            title: "Final Check",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Items in int arr[6]?",
                type: "mcq",
                options: ["4", "6", "8", "10"],
                correctAnswer: "6",
                explanation: "The number within [ ] is the item count",
                xp: 3
              }
            ]
          }
        ],
        keyTakeaways: [
          "Arrays store multiple values",
          "Different data types available",
          "Memory size = items × item size",
          "Count elements = total bytes ÷ item size"
        ]
      },
      {
        unitId: "unit2",
        title: "Array Access",
        duration: 14,
        totalXP: 50,
        displayMessage: "Learn to access (get) array values!",
        screens: [
          {
            screenId: "screen1",
            title: "Array Indexing",
            description: "Arrays start at 0!\nFirst item = index 0",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Array indexing Example",
            description: "scores[3] = {95, 87, 92}\nindex 0: 95\nindex 1: 87\nindex 2: 92",
            type: "content"
          },
          {
            screenId: "screen3",
            title: "Indexing Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "scores[3] = {95, 87, 92}\nscores[1] is:",
                type: "mcq",
                options: ["95", "87", "92", "Error"],
                correctAnswer: "87",
                explanation: "index 1 = second item = 87",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen4",
            title: "Why Start at index 0?",
            description: "Makes math easier!\nBetter for memory addresses",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "Access Values",
            description: "Get values with index:\ncout << scores[index];",
            type: "content",
            codeExample: "scores[3] = {95, 87, 92}\ncout << scores[0]; // shows 95"
          },
          {
            screenId: "screen6",
            title: "Change Values",
            description: "Update values like:\nscores[index] = value;",
            type: "content",
            codeExample: "scores[3] = {95, 87, 92}\nscores[1] = 90; // scores updated\nscores = {95, 90, 92}"
          },
          {
            screenId: "screen7",
            title: "Access Practice",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "scores[3] = {95, 90, 92}\nChange first score to 100",
                type: "coding",
                correctAnswer: "scores[0] = 100;",
                explanation: "First item is index 0, scores[0] = 100;",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen8",
            title: "Memory Addresses",
            description: "Arrays live in memory\nEach item has an address",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Address Calculation",
            description: "Address = Start + (Index × Item Size)",
            type: "content"
          },
          {
            screenId: "screen10",
            title: "Address Example",
            description: "Start (Base address) at 1000:\nscores[3] = {95, 90, 92}\nIndex: 0, 1, 2\nAddress: 1000, 1004, 1008",
            type: "content"
          },
          {
            screenId: "screen11",
            title: "Memory Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Where is index 3? Start = 2000",
                type: "mcq",
                options: ["2003", "2004", "2012", "2000"],
                correctAnswer: "2012",
                explanation: "2000 + (3 × 4) = 2012",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen12",
            title: "Show All Values",
            description: "Use loops to display array:",
            type: "content",
            codeExample: "for(int i=0; i<3; i++) {\n  cout << scores[i];\n}"
          },
          {
            screenId: "screen13",
            title: "Loop Practice",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Loop shows how many array values:",
                type: "mcq",
                options: ["One value", "All values", "No values", "Error"],
                correctAnswer: "All values",
                explanation: "Loop visits each item once",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen14",
            title: "Boundaries",
            description: "Don't go beyond array size!\nscores[3] = ERROR",
            type: "content"
          },
          {
            screenId: "screen15",
            title: "Practice",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "int arr[4] = {1, 2, 3, 4}\nGet array value at index 4",
                type: "mcq",
                options: ["4", "3", "-1", "Error"],
                correctAnswer: "Error",
                explanation: "Access beyond size cannot happen, it gives error",
                xp: 3
              }
            ]

          }
        ],
        keyTakeaways: [
          "Indexing starts at 0",
          "Access with array[index]",
          "Use loops for all values",
          "Stay within array bounds"
        ]
      },
      {
        unitId: "unit3",
        title: "Array Operations",
        duration: 16,
        totalXP: 60,
        displayMessage: "Let's work with arrays!",
        screens: [
          {
            screenId: "screen1",
            title: "Time Complexity",
            description: "How much time a code takes to run\nO(1) = instant\nO(n) = takes time",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Speed Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "O(1) means:",
                type: "mcq",
                options: ["Very slow", "Instant", "Medium speed", "No speed"],
                correctAnswer: "Instant",
                explanation: "O(1) = constant time = instant",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen3",
            title: "Array Speeds",
            description: "Access: O(1) - instant!\nShow all: O(n) - takes time",
            type: "content"
          },
          {
            screenId: "screen4",
            title: "Access Speed",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "arr[5] access time:",
                type: "mcq",
                options: ["O(1)", "O(n)", "O(n²)", "Slow"],
                correctAnswer: "O(1)",
                explanation: "Direct access is always instant!",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen5",
            title: "Traversal",
            description: "Visit all items:\nUse a loop",
            type: "content"
          },
          {
            screenId: "screen6",
            title: "Traversal Code",
            description: "Show all scores:",
            type: "content",
            codeExample: "for(int i=0; i<4; i++) {\n  cout << scores[i];\n}"
          },
          {
            screenId: "screen7",
            title: "Traversal Time",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Traversal time:",
                type: "mcq",
                options: ["O(1)", "O(n)", "O(log n)", "Instant"],
                correctAnswer: "O(n)",
                explanation: "Loop visits each item once, so visiting n elements = O(n)",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen8",
            title: "Insertion",
            description: "To add new value at index 1, first shift right from 1 then add new value at 1",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Insert Example",
            description: "Add 15 at index 1:\nint arr[4] = {10,20,30,40}\nShift: {10, ,20,30,40}\nInsert: {10,15,20,30,40}",
            type: "content"
          },
          {
            screenId: "screen10",
            title: "Insert Code",
            description: "First make space, then insert:",
            type: "content",
            codeExample: "for(int i=3; i>=2; i--) {\n  arr[i+1] = arr[i];\n}\narr[2] = 25;"
          },
          {
            screenId: "screen11",
            title: "Insert Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Insert in middle:",
                type: "mcq",
                options: ["O(1)", "O(n)", "Fast", "Instant"],
                correctAnswer: "O(n)",
                explanation: "Need to shift items = takes time",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen12",
            title: "Deletion",
            description: "Remove item from index by shifting items left to that index",
            type: "content"
          },
          {
            screenId: "screen13",
            title: "Delete Example",
            description: "Remove from index 2:\nint arr[4] = {10,20,30,40}\nRemove:  {10,20, ,40}\nShift: {10,20,30}",
            type: "content"
          },
          {
            screenId: "screen14",
            title: "Delete Code",
            description: "Shift items left:",
            type: "content",
            codeExample: "for(int i=1; i<2; i++) {\n  arr[i] = arr[i+1];\n}"
          },
          {
            screenId: "screen15",
            title: "Delete Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Fastest operation:",
                type: "mcq",
                options: ["Access", "Insert", "Delete", "Traversal"],
                correctAnswer: "Access",
                explanation: "Direct access is fastest!",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen16",
            title: "Operations Summary",
            description: "Access: O(1) - Fast!\nInsert/Delete: O(n) - Slow\nTraversal: O(n) - Normal",
            type: "content"
          }
        ],
        keyTakeaways: [
          "Access is instant O(1)",
          "Insert/delete needs shifting",
          "Traversal visits all items",
          "Big O measures speed"
        ]
      },
      {
        unitId: "unit4",
        title: "Searching Arrays",
        duration: 10,
        totalXP: 45,
        displayMessage: "Find items in arrays!",
        screens: [
          {
            screenId: "screen1",
            title: "Linear Search",
            description: "Check each item one by one\nWorks on any array",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Linear search Code",
            description: "Find target value:",
            type: "content",
            codeExample: "for(int i=0; i<5; i++) {\n  if(arr[i] == target) {\n    cout << \"Found!\";\n  }\n}"
          },
          {
            screenId: "screen3",
            title: "Linear Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Linear search time:",
                type: "mcq",
                options: ["O(1)", "O(n)", "O(log n)", "Fast"],
                correctAnswer: "O(n)",
                explanation: "Might check every item",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen4",
            title: "Binary Search",
            description: "Much faster!\nBut needs sorted array",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "Binary Steps",
            description: "1. Check middle\n2. If smaller, go left\n3. If larger, go right\n4. Repeat!",
            type: "content"
          },
          {
            screenId: "screen6",
            title: "Binary Code",
            description: "Works on sorted arrays:",
            type: "content",
            codeExample: "while(low <= high) {\n  mid = (low + high) / 2;\n  if(arr[mid] == target) found!\n}"
          },
          {
            screenId: "screen7",
            title: "Binary Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Binary search needs:",
                type: "mcq",
                options: ["Any array", "Sorted array", "Small array", "No array"],
                correctAnswer: "Sorted array",
                explanation: "Only works on sorted arrays!",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen8",
            title: "Search Comparison",
            description: "Unsorted: Linear Search\nSorted: Binary Search",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Practice Search",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Find 30 in: {10,20,30,40} using linear search",
                type: "coding",
                correctAnswer: "for(int i=0;i<4;i++){\n  if(arr[i]==30) cout<<\"Found\";\n}",
                explanation: "Use linear search code",
                xp: 5
              }
            ]
          }
        ],
        keyTakeaways: [
          "Linear checks each item",
          "Binary splits in half",
          "Linear works on any array",
          "Binary needs sorted array"
        ]
      },
      {
        unitId: "unit5",
        title: "2D Arrays",
        duration: 8,
        totalXP: 40,
        displayMessage: "Grids and tables!",
        screens: [
          {
            screenId: "screen1",
            title: "What are 2D Arrays?",
            description: "It's like a grid or table.\nIt has rows and columns.",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "2D Example",
            description: "Classroom seats:\n3 rows, 4 columns",
            type: "content",
            codeExample: "int seats[3][4];"
          },
          {
            screenId: "screen3",
            title: "2D Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "2D arrays have:",
                type: "mcq",
                options: ["Only rows", "Only columns", "Rows and columns", "No structure"],
                correctAnswer: "Rows and columns",
                explanation: "2D = two dimensions = rows × columns",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen4",
            title: "Access 2D Elements",
            description: "Use [row][column] to access elements",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "2D Access Example",
            description: "To access element with specific row and column number:",
            type: "content",
            codeExample: "int seats[2][2] = {{1,2},{3,4}};\n//seats[0][0] = 1, \n//seats[0][1] = 2, \n//seats[1][0] = 3, \n//seats[1][1] = 4"
          },
          {
            screenId: "screen6",
            title: "2D Access Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "seats[0][0] is:",
                type: "mcq",
                options: ["Top-left", "Top-right", "Bottom-left", "Bottom-right"],
                correctAnswer: "Top-left",
                explanation: "Row 0, Column 0 = top-left corner",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen7",
            title: "Show 2D Array",
            description: "Use nested loops to display all items",
            type: "content"
          },
          {
            screenId: "screen8",
            title: "2D Display Code",
            description: "Nested loops example:",
            type: "content",
            codeExample: "for(int row=0; row<3; row++) {\n  for(int col=0; col<4; col++) {\n    cout << seats[row][col];\n  }\n}"
          },
          {
            screenId: "screen9",
            title: "Create 2D Array",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Make 2×2 grid with 1,2,3,4",
                type: "coding",
                correctAnswer: "int grid[2][2] = {{1,2},{3,4}};",
                explanation: "Perfect! You created a 2×2 grid",
                xp: 5
              }
            ]
          },
          {
            screenId: "screen10",
            title: "2D Uses",
            description: "2D arrays are used in:\nGame boards\nSpreadsheets\nImages\nMatrices",
            type: "content"
          }
        ],
        keyTakeaways: [
          "2D arrays are grids",
          "Access with [row][column]",
          "Use nested loops to display",
          "Great for tables and games"
        ]
      }
    ]
  },
  {
    courseId: "1",
    title: "Project Management",
    category: "Non-Computational",
    difficulty: "Beginner",
    totalDuration: 55,
    totalXP: 220,
    learningObjectives: [
      "Understand project basics and lifecycle",
      "Compare Waterfall and Agile methods",
      "Use Scrum and Kanban frameworks",
      "Choose the right method for projects"
    ],
    units: [
      {
        unitId: "unit1",
        title: "Project Basics",
        duration: 10,
        totalXP: 40,
        displayMessage: "Learn project fundamentals!",
        screens: [
          {
            screenId: "screen1",
            title: "What is a Project?",
            description: "Temporary work with a goal\nHas start and end date",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Project Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Projects have:",
                type: "mcq",
                options: ["No end date", "Clear end date", "No goal", "No plan"],
                correctAnswer: "Clear end date",
                explanation: "Projects must end!",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen3",
            title: "Project Examples",
            description: "Build website\nPlan wedding\nLaunch product\nOrganize event",
            type: "content"
          },
          {
            screenId: "screen4",
            title: "Project vs Daily Work",
            description: "Project: Temporary\nDaily Work: Repeats forever",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "Work Type Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Daily email is:",
                type: "mcq",
                options: ["Project", "Daily work", "Both", "Neither"],
                correctAnswer: "Daily work",
                explanation: "Repeats daily = daily work",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen6",
            title: "Project Lifecycle",
            description: "Plan → Do → Check → Act\nRepeat until done!",
            type: "content"
          },
          {
            screenId: "screen7",
            title: "Triple Constraint",
            description: "Time ⏰\nCost 💰\nScope 📦\nBalance all three!",
            type: "content"
          },
          {
            screenId: "screen8",
            title: "Constraint Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "More features affect:",
                type: "mcq",
                options: ["Only time", "Only cost", "Time and cost", "Nothing"],
                correctAnswer: "Time and cost",
                explanation: "More work = more time + more money",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen9",
            title: "Project Manager",
            description: "Team leader\nPlans work\nSolves problems",
            type: "content"
          },
          {
            screenId: "screen10",
            title: "Final Basics Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Project manager is like:",
                type: "mcq",
                options: ["Boss", "Team captain", "Accountant", "Customer"],
                correctAnswer: "Team captain",
                explanation: "Leads and coordinates the team!",
                xp: 3
              }
            ]
          }
        ],
        keyTakeaways: [
          "Projects have clear goals",
          "Balance time, cost, scope",
          "Project manager leads team",
          "Follow plan-do-check-act"
        ]
      },
      {
        unitId: "unit2",
        title: "Waterfall Method",
        duration: 12,
        totalXP: 45,
        displayMessage: "Step-by-step approach!",
        screens: [
          {
            screenId: "screen1",
            title: "What is Waterfall?",
            description: "Finish each step before next\nLike building a house!",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Waterfall Steps",
            description: "Plan → Design → Build → Test → Deliver",
            type: "content"
          },
          {
            screenId: "screen3",
            title: "Steps Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "First step:",
                type: "mcq",
                options: ["Build", "Plan", "Test", "Deliver"],
                correctAnswer: "Plan",
                explanation: "Always plan first!",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen4",
            title: "No Going Back",
            description: "Once step done, can't change\nUnless formal change request",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "Waterfall Example",
            description: "Build bridge:\n1. Plan design\n2. Create blueprints\n3. Build structure\n4. Test safety\n5. Open bridge",
            type: "content"
          },
          {
            screenId: "screen6",
            title: "Example Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Blueprints are in:",
                type: "mcq",
                options: ["Plan phase", "Design phase", "Build phase", "Test phase"],
                correctAnswer: "Design phase",
                explanation: "Design phase creates blueprints",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen7",
            title: "When to Use",
            description: "Clear requirements\nConstruction\nGovernment projects",
            type: "content"
          },
          {
            screenId: "screen8",
            title: "Gantt Charts",
            description: "Visual timeline:\nTask 1: |======|\nTask 2:   |======|",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Pros and Cons",
            description: "✅ Clear plan\n✅ Easy to track\n❌ No flexibility\n❌ Late feedback",
            type: "content"
          },
          {
            screenId: "screen10",
            title: "Pros Cons Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Waterfall is good for:",
                type: "mcq",
                options: ["Changing projects", "Clear projects", "Creative projects", "Unknown projects"],
                correctAnswer: "Clear projects",
                explanation: "Needs clear requirements upfront",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen11",
            title: "Waterfall Summary",
            description: "Structured\nPredictable\nNot flexible",
            type: "content"
          },
          {
            screenId: "screen12",
            title: "Final Waterfall Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Waterfall is like:",
                type: "mcq",
                options: ["Exploring", "Following recipe", "Improvising", "Guessing"],
                correctAnswer: "Following recipe",
                explanation: "Step-by-step, no changes",
                xp: 3
              }
            ]
          }
        ],
        keyTakeaways: [
          "Sequential phases",
          "No going back",
          "Good for clear projects",
          "Uses Gantt charts"
        ]
      },
      {
        unitId: "unit3",
        title: "Agile Method",
        duration: 12,
        totalXP: 50,
        displayMessage: "Flexible approach!",
        screens: [
          {
            screenId: "screen1",
            title: "What is Agile?",
            description: "Build in small pieces\nGet feedback\nImprove constantly",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Agile Values",
            description: "People over processes\nWorking software over docs\nCustomer collaboration\nResponding to change",
            type: "content"
          },
          {
            screenId: "screen3",
            title: "Values Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Agile prefers:",
                type: "mcq",
                options: ["Processes", "People", "Documentation", "Plans"],
                correctAnswer: "People",
                explanation: "People over processes!",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen4",
            title: "Agile vs Waterfall",
            description: "Waterfall: One big delivery\nAgile: Many small deliveries",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "Comparison Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Agile delivers:",
                type: "mcq",
                options: ["Once at end", "Frequently", "Never", "Randomly"],
                correctAnswer: "Frequently",
                explanation: "Many small deliveries",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen6",
            title: "Iterative Development",
            description: "Build → Test → Feedback → Improve\nRepeat!",
            type: "content"
          },
          {
            screenId: "screen7",
            title: "User Stories",
            description: "As a [user]\nI want [feature]\nSo that [benefit]",
            type: "content"
          },
          {
            screenId: "screen8",
            title: "Story Example",
            description: "As a student\nI want progress tracking\nSo I stay motivated",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Story Practice",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Write login user story",
                type: "text",
                correctAnswer: "As a user I want to login so I can access my account",
                explanation: "Perfect user story format!",
                xp: 4
              }
            ]
          },
          {
            screenId: "screen10",
            title: "When to Use Agile",
            description: "Changing requirements\nSoftware projects\nCreative work\nLearning projects",
            type: "content"
          },
          {
            screenId: "screen11",
            title: "Agile Summary",
            description: "Flexible\nAdaptive\nCustomer-focused",
            type: "content"
          },
          {
            screenId: "screen12",
            title: "Final Agile Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Agile handles:",
                type: "mcq",
                options: ["No changes", "Many changes", "Only big changes", "Random changes"],
                correctAnswer: "Many changes",
                explanation: "Agile welcomes changes!",
                xp: 3
              }
            ]
          }
        ],
        keyTakeaways: [
          "Flexible and adaptive",
          "Many small deliveries",
          "Uses user stories",
          "Great for changes"
        ]
      },
      {
        unitId: "unit4",
        title: "Scrum Framework",
        duration: 11,
        totalXP: 45,
        displayMessage: "Popular Agile framework!",
        screens: [
          {
            screenId: "screen1",
            title: "What is Scrum?",
            description: "Agile framework\nUses fixed-length Sprints",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Scrum Roles",
            description: "Product Owner\nScrum Master\nDevelopment Team",
            type: "content"
          },
          {
            screenId: "screen3",
            title: "Roles Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Who prioritizes work?",
                type: "mcq",
                options: ["Scrum Master", "Product Owner", "Team", "CEO"],
                correctAnswer: "Product Owner",
                explanation: "Product Owner decides what to build",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen4",
            title: "Product Owner",
            description: "Voice of customer\nDecides what to build\nMaximizes value",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "Scrum Master",
            description: "Team coach\nRemoves obstacles\nEnsures Scrum rules",
            type: "content"
          },
          {
            screenId: "screen6",
            title: "Development Team",
            description: "The builders!\nCross-functional\nSelf-organizing",
            type: "content"
          },
          {
            screenId: "screen7",
            title: "Team Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Scrum Master is:",
                type: "mcq",
                options: ["Boss", "Coach", "Builder", "Customer"],
                correctAnswer: "Coach",
                explanation: "Coaches team and removes problems",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen8",
            title: "Scrum Artifacts",
            description: "Product Backlog\nSprint Backlog\nIncrement",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Sprint Cycle",
            description: "1-4 week period:\nPlan → Build → Review → Reflect",
            type: "content"
          },
          {
            screenId: "screen10",
            title: "Daily Scrum",
            description: "15-minute daily:\nWhat did I do?\nWhat will I do?\nAny problems?",
            type: "content"
          },
          {
            screenId: "screen11",
            title: "Final Scrum Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Daily Scrum length:",
                type: "mcq",
                options: ["1 hour", "15 minutes", "30 minutes", "All day"],
                correctAnswer: "15 minutes",
                explanation: "Quick daily sync, not long meeting!",
                xp: 3
              }
            ]
          }
        ],
        keyTakeaways: [
          "Three key roles",
          "Fixed-length Sprints",
          "Daily 15-minute meetings",
          "Product Backlog guides work"
        ]
      },
      {
        unitId: "unit5",
        title: "Kanban & Hybrid",
        duration: 10,
        totalXP: 40,
        displayMessage: "Visual workflow methods!",
        screens: [
          {
            screenId: "screen1",
            title: "What is Kanban?",
            description: "Visual workflow system\nSee all work at once",
            type: "content"
          },
          {
            screenId: "screen2",
            title: "Kanban Board",
            description: "To Do → Doing → Done\nMove tasks like sticky notes",
            type: "content"
          },
          {
            screenId: "screen3",
            title: "Board Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Kanban shows:",
                type: "mcq",
                options: ["Only plans", "Work status", "Team photos", "Budget"],
                correctAnswer: "Work status",
                explanation: "Visualizes all work progress",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen4",
            title: "WIP Limits",
            description: "Work In Progress limits\nPrevents overload\nFocuses team",
            type: "content"
          },
          {
            screenId: "screen5",
            title: "WIP Example",
            description: "Max 3 tasks in 'Doing'\nFinish before starting new",
            type: "content"
          },
          {
            screenId: "screen6",
            title: "WIP Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "WIP limits prevent:",
                type: "mcq",
                options: ["Teamwork", "Overload", "Meetings", "Planning"],
                correctAnswer: "Overload",
                explanation: "Prevents taking too much work",
                xp: 3
              }
            ]
          },
          {
            screenId: "screen7",
            title: "Kanban vs Scrum",
            description: "Scrum: Time-boxed\nKanban: Continuous\nBoth: Visual",
            type: "content"
          },
          {
            screenId: "screen8",
            title: "Scrumban",
            description: "Hybrid method\nSprints from Scrum\nBoard from Kanban",
            type: "content"
          },
          {
            screenId: "screen9",
            title: "Choose Method",
            description: "Clear requirements: Waterfall\nChanging needs: Scrum\nContinuous flow: Kanban\nMixed: Scrumban",
            type: "content"
          },
          {
            screenId: "screen10",
            title: "Final Choice Quiz",
            type: "concept-check",
            questions: [
              {
                questionId: "q1",
                question: "Best for changing app:",
                type: "mcq",
                options: ["Waterfall", "Scrum", "Kanban", "All"],
                correctAnswer: "Scrum",
                explanation: "Scrum handles changes well!",
                xp: 4
              }
            ]
          }
        ],
        keyTakeaways: [
          "Kanban uses visual boards",
          "WIP limits prevent overload",
          "Scrumban combines methods",
          "Choose based on project needs"
        ]
      }
    ]
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing courses
    await Course.deleteMany({});

    // Insert sample courses
    await Course.insertMany(sampleCourses);

    // Add admin creation HERE
    const existingAdmin = await User.findOne({ email: 'admin@skillsprint.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin',
        email: 'admin@skillsprint.com',
        password: 'admin123',
        role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created');
    }
    else{
      console.log('Admin user already exists');
    }
    console.log('Database seeded successfully with courses!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();