document.addEventListener('DOMContentLoaded', function () {
    userLogin()
})

const BASE_URL = "https://bestexpensestracker.herokuapp.com"
const USERS_URL = `${BASE_URL}/users`
const GROUPED_EXPENSES_URL = `${USERS_URL}/expenses_by_categories`
const CATEGORIES_URL = `${BASE_URL}/categories`
const EXPENSES_URL = `${BASE_URL}/expenses`
var User = {}


//Expenses by Categories
function buildGroupedExpenses(user) {
    fetch(GROUPED_EXPENSES_URL + `/${user.id}`)
        .then(resp => resp.json())
        .then(groupedCategories => {
            categoriesTable(groupedCategories)
            drawChart(groupedCategories.categories)
        })
}

function categoriesTable(groupedCategories) {
    let body = document.querySelector('#grouped-expenses-body')
    body.innerHTML = ""
    groupedCategories.categories.forEach(category => {
        let catRow = document.createElement('tr')
        let categoryName = document.createElement('td')
        categoryName.textContent = category.categoryName
        let categoryAmount = document.createElement('td')
        categoryAmount.textContent = convertMoney(category.amount)
        catRow.append(categoryName, categoryAmount)
        body.append(catRow)
    })

    let total = document.createElement('tr')
    let expenseTotal = document.createElement("td")
    expenseTotal.innerText = "Total Expenses"
    expenseTotal.className = "fw-bold"
    let expenseAmount = document.createElement('td')
    expenseAmount.textContent = convertMoney(groupedCategories.totalAmount)
    expenseAmount.className = "fw-bold"
    total.append(expenseTotal, expenseAmount)
    body.append(total)
}

//All Expenses
function getUserExpenses(user) {

    fetch(`${USERS_URL}/${user.id}`)
        .then(res => res.json())
        .then(user => {
            let tableBody = document.getElementById('expenses-table-body')
            tableBody.innerHTML = ''
            user.expenses.forEach(expense => addExpenseToTable(expense))
        })
}

function addExpenseToTable(expense) {
    let tableBody = document.getElementById('expenses-table-body')
    let tr = document.createElement('tr')
    let tdEditForm = document.createElement('td')

    let description = document.createElement('td')
    let amount = document.createElement('td')
    let date = document.createElement('td')
    let category = document.createElement('td')
    let tdEditBtn = document.createElement('td')
    let tdDeleteBtn = document.createElement('td')
    let editBtn = document.createElement('button')
    let deleteBtn = document.createElement('button')

    deleteBtn.addEventListener('click', () => deleteExpense(expense.id))
    editBtn.addEventListener('click', () => displayEditExpense(expense))

    tdEditForm.id = `${expense.id}-exp-edit`
    tdEditForm.className = `hidden edit td`
    tr.id = `expense-${expense.id}`
    editBtn.id = `edit-exp-${expense.id}`
    editBtn.className = "btn btn-outline-success btn-sm"
    deleteBtn.id = `delete-exp-${expense.id}`
    deleteBtn.className = "btn btn-outline-secondary btn-sm"

    editBtn.textContent = 'Edit'
    deleteBtn.textContent = 'Delete'

    //Changing Date display
    const d = new Date(expense.date);
    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d);
    const mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
    const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d);


    description.textContent = expense.description
    amount.textContent = convertMoney(expense.amount)
    date.textContent = `${da} ${mo}, ${ye}`
    category.textContent = expense.category.name
    tdEditBtn.append(editBtn)
    tdDeleteBtn.append(deleteBtn)
    tr.append(tdEditForm, description, amount, date, tdEditBtn, tdDeleteBtn)
    tableBody.appendChild(tr)
}

function displayEditExpense(expense) {
    let hiddenTd = document.getElementById(`${expense.id}-exp-edit`)
    let headerRow = document.getElementById('headerRow')

    if (hiddenTd.classList.contains("hidden")) {
        let editExpForm = document.getElementById('edit-expense')
        let editHeader = document.createElement('th')
        editHeader.innerHTML = 'Edit'
        editHeader.id = 'editHeader'

        // editExpForm.id = `${expense.id}`
        editExpForm.id = `exp-edit-form-${expense.id}`
        editExpForm.addEventListener('submit', handleExpenseEdit)
        editExpForm.className = 'exp-edit'
        hiddenTd.append(editExpForm)
        hiddenTd.className = 'edit td'

        //Append header at beginning of row
        headerRow.insertBefore(editHeader, headerRow.firstChild)

    } else {
        restoreExpenseEditForm(expense.id)

        hiddenTd.className = 'hidden edit td'

        hiddenTd.innerHTML = ''

    }

}

function handleExpenseEdit(e) {
    e.preventDefault()
    console.log()
    let select = document.querySelector('.form-select-edit')
    let editedAmount = (e.target.amount.value === '') ? 0.00 : e.target.amount.value
    let editedDate = (e.target.date.value === '') ? Date() : e.target.date.value


    expId = parseInt(e.target.parentElement.parentElement.id).toString()
    editedExpense = {
        description: e.target.description.value,
        amount: editedAmount,
        date: editedDate,
        categoryId: select.options[select.selectedIndex].value,
        userId: User.id
    }

    fetch(`${BASE_URL}/expenses/${expId}`,{
        method:'PATCH',
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(editedExpense)})
        .then(res => res.json())
        .then(exp => {
            restoreExpenseEditForm(expId)

            getUserExpenses(User)
            buildGroupedExpenses(User)
        })
}

function restoreExpenseEditForm(expenseId) {
    let editExpForm = document.getElementById(`exp-edit-form-${expenseId}`)
    editExpForm.id = `edit-expense`
    editExpForm.className = 'hidden'
    let expFormEditReset = document.querySelector('#expense-form-edit')
    expFormEditReset.reset()
    let body = document.querySelector('#body')
    body.append(editExpForm)
    editHeader.remove()
}

//Delete Expenses and Update TWO tables (expenses by categories and detailed Info)
function deleteExpense(expenseId){
    fetch(EXPENSES_URL + `/${expenseId}`,{
        method:'DELETE'
    })
        .then(res => res.json())
        .then(() => {
            let expense = document.getElementById(`expense-${expenseId}`)
            expense.remove()
            buildGroupedExpenses(User)
        })
}

// Add new expense Form

//Categories Options
function addCategoriesToForm() {
    fetch(CATEGORIES_URL)
        .then(res => res.json())
        .then(categories => {
            categories.forEach(category => {
                let select = document.querySelector('.form-select')
                let option = document.createElement('option')
                option.value = category.id
                option.textContent = category.name
                select.appendChild(option)

                let selectEdit = document.querySelector('.form-select-edit')
                let optionEdit = document.createElement('option')

                optionEdit.value = category.id
                optionEdit.textContent = category.name

                selectEdit.appendChild(optionEdit)
            })
        })
}

function addEventListenerToExpenseForm(user){
    let form = document.querySelector("#expense-form")
    form.addEventListener('submit', function (e) {
        e.preventDefault()
        let select = document.querySelector('.form-select')

        let newAmount = (e.target.amount.value === '') ? 0.00 : e.target.amount.value
        let newDate = (e.target.date.value === '') ? Date() : e.target.date.value

        let newExpense = {
                categoryId: select.options[select.selectedIndex].value,
                userId: User.id,
                description: e.target.description.value,
                amount: newAmount,
                date: newDate
            }

        addNewExpense(newExpense)

        //Update the form
        form.reset()
    })
}

function addNewExpense(expense){
    fetch(`${BASE_URL}/expenses`,{
        method:'POST',
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(expense)
    })
        .then(res => res.json())
        .then(expense => {
            addExpenseToTable(expense)
            buildGroupedExpenses(User)
        })
}

// Display Budget
function displayBudget(user) {
    let budgetAmount = document.querySelector('#budget-amount')
    if (user.budget === null){
        user.budget = 0
    }
    budgetAmount.textContent = 'Budget: ' + convertMoney(user.budget)
    let budgetEditBtn = document.querySelector('#budget-edit')
    budgetEditBtn.addEventListener('click', handleEdit)
}
function handleEdit (){
    let budgetForm = document.querySelector('.budget')
    if (budgetForm.classList.contains("hidden")) {
        budgetForm.className = "budget flex"
    } else
        budgetForm.className = "budget hidden"
}

//Edit Budget
function editBudget() {
    let submitBudgetBtn = document.querySelector('#budget-submit')
    submitBudgetBtn.addEventListener('click', handleSubmit)
}

function handleSubmit() {
    let newBudget = document.querySelector('#set-budget-input').value
    postBudget(newBudget)
}

function postBudget(newBudget) {
    intBudget = parseInt(newBudget)
    if (intBudget < 0 || newBudget === "") {
        intBudget = 0
    }
    fetch(USERS_URL + `/${User.id}`,{
        method: 'PATCH',
        headers: {
            'Content-Type':'application/json',
        },
        body: JSON.stringify({budget: intBudget})
    })
        .then(resp => resp.json())
        .then(budget => {
            let displayBudget = document.querySelector('#budget-amount')
            displayBudget.textContent = 'Budget: ' + convertMoney(intBudget)
            let newBudgetInput = document.querySelector('#set-budget-input')
            newBudgetInput.value = ""
        })
}


//Convert Int to $$
function convertMoney(money) {
    return `$ ${money.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}

//User LogIn
function userLogin() {
    let userLoginBtn = document.querySelector('#user-login')
    userLoginBtn.addEventListener('click', handleLogin)
}

function handleLogin(e) {
    e.preventDefault()
    let userName = document.querySelector('#user-name').value
    if (userName == "") {
        return
    }

    let loginForm = document.querySelector('#login-form')
    loginForm.className = "hidden"

    var el = document.getElementById('loading'),
    i = 0,
    load = setInterval(function() {
      i = ++i % 4;
      el.innerHTML = 'Loading' + Array(i + 1).join('.');
      }, 600);
    el.className='loadingMessage'
    el.display='flex'

    fetch(USERS_URL, {
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
        },
        body: JSON.stringify({'name': userName})
    })
        .then(resp => resp.json())
        .then(user => setupUI(user))
}

function setupUI(user) {
    User = user
    let main = document.querySelector('#main')
    main.className = "container"

    let userInfo = document.querySelector('#user-info')
    userInfo.className = "navbar-brand mb-0 text-light"

    let el = document.getElementById('loading')
    el.remove()

    let welcomeSpan = document.querySelector('#welcome-user')
    welcomeSpan.textContent = "Hi, " + `${user.name}`

    buildGroupedExpenses(User)
    getUserExpenses(User)
    displayBudget(User)
    editBudget()
    addEventListenerToExpenseForm(User)
    addCategoriesToForm()
    userLogout()
    deleteAccount()
}

//User LogOut
function userLogout() {
    let userLogoutBtn = document.querySelector('#user-logout')
    userLogoutBtn.addEventListener('click', handleLogout)
}

function handleLogout(e) {
    e.preventDefault()
    window.localStorage.clear();
    window.location.reload()
}

//Delete Account
function deleteAccount(user) {
    let userDeleteBtn = document.querySelector('#user-delete')
    userDeleteBtn.addEventListener('click', handleDeleteAccount)
}

function handleDeleteAccount(e) {
    e.preventDefault()
    fetch(USERS_URL + `/${User.id}`,{
        method:'DELETE'
    })
        .then(res => res.json())
        .then(() => {
            window.localStorage.clear();
            window.location.reload()
        })
}

//Doughnut chart
function drawChart(categories) {
    let categoriesLabels = []
    let categoriesValues = []
    categories.forEach(category => {
        categoriesLabels.push(category.categoryName)
        categoriesValues.push(parseInt(category.amount.toString()))
    })

    let ctx = document.getElementById('myChart').getContext('2d');
    let myDoughnutChart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'doughnut',

        // The data for our dataset
        data: {
            labels: categoriesLabels,
            datasets: [{
                label: 'My First dataset',
                backgroundColor: [
                    'rgba(255, 99, 132, 1)', //1
                    'rgba(54, 162, 235, 1)', //2
                    'rgba(255, 206, 86, 1)', //3
                    'rgba(75, 192, 192, 1)', //4
                    'rgba(153, 102, 255, 1)', //5
                    'rgba(255, 159, 64, 1)', //6
                    'rgba(137, 24, 48, 1)', //7
                    'rgba(89, 184, 90, 1)', //8
                    'rgba(242, 186, 198, 1)', //9
                    'rgba(178, 209, 229, 1)', //10
                    'rgba(240, 225, 188, 1)', //11
                    'rgba(209, 192, 244, 1)', //12
                    'rgba(255, 223, 192, 1)', //13
                    'rgba(249, 36, 36, 1)', //14
                    'rgba(36, 72, 249, 1)', //15
                    'rgba(246, 102, 255, 1)', //16
                    'rgba(137, 137, 137, 1)', //17
                ],
                hoverOffset: 10,
                data: categoriesValues,
            }]
        },

        // Configuration options go here
        options: {
            legend: {
                labels: {
                    // This more specific font property overrides the global property
                    fontColor: 'white'
                }
            }
        }
    });
}
