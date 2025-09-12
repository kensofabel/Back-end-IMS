<?php
$servername = "localhost";
$dbname = "black_basket_db";
$username = "root"; // default XAMPP username
$password = "";     // default XAMPP password is empty

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>