<?php
// import_inventory.php
require_once '../../config/db.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['import_file'])) {
    $file = $_FILES['import_file']['tmp_name'];
    if (($handle = fopen($file, 'r')) !== FALSE) {
        $header = fgetcsv($handle); // Skip header
        while (($data = fgetcsv($handle)) !== FALSE) {
            // Adjust column indexes as needed
            $name = $conn->real_escape_string($data[1]);
            $category = $conn->real_escape_string($data[2]);
            $stock = (int)$data[3];
            $price = (float)$data[4];
            $sql = "INSERT INTO inventory (name, category, stock, price) VALUES ('$name', '$category', $stock, $price)";
            $conn->query($sql);
        }
        fclose($handle);
        header('Location: index.php?import=success');
        exit();
    }
}
header('Location: index.php?import=fail');
exit;
