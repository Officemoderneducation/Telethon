// Users Management JS

document.addEventListener("DOMContentLoaded", function () {

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const userForm = document.getElementById("userForm");
    const userTable = document.getElementById("userTable");
    const searchUser = document.getElementById("searchUser");

    // Display Users
    function displayUsers(data = users) {

        userTable.innerHTML = "";

        data.forEach((user, index) => {

            userTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUser(${index})">
                        Edit
                    </button>

                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${index})">
                        Delete
                    </button>
                </td>
            </tr>
            `;

        });
    }


    // Add User
    if(userForm){

        userForm.addEventListener("submit", function(e){

            e.preventDefault();


            let name = document.getElementById("userName").value;
            let email = document.getElementById("userEmail").value;
            let role = document.getElementById("userRole").value;


            users.push({
                name:name,
                email:email,
                role:role
            });


            localStorage.setItem("users", JSON.stringify(users));


            userForm.reset();

            displayUsers();

            alert("User Added Successfully");

        });

    }



    // Delete User
    window.deleteUser = function(index){

        if(confirm("Are you sure you want to delete this user?")){

            users.splice(index,1);

            localStorage.setItem(
                "users",
                JSON.stringify(users)
            );

            displayUsers();

        }

    }



    // Edit User
    window.editUser = function(index){

        let user = users[index];


        document.getElementById("userName").value = user.name;
        document.getElementById("userEmail").value = user.email;
        document.getElementById("userRole").value = user.role;


        users.splice(index,1);

        localStorage.setItem(
            "users",
            JSON.stringify(users)
        );

    }



    // Search User
    if(searchUser){

        searchUser.addEventListener("keyup",function(){

            let value = this.value.toLowerCase();


            let filtered = users.filter(user =>

                user.name.toLowerCase().includes(value) ||
                user.email.toLowerCase().includes(value)

            );


            displayUsers(filtered);

        });

    }



    displayUsers();

});
