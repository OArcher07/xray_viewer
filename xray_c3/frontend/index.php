<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Form</title>
</head>
<body>
  <h2>Patient Information Form</h2>
  
  <?php
  // Database connection variables
  $host = 'localhost';
  $db = 'cdc';
  $user = 'postgres';
  $pass = 'cdc';
  
  // Process form submission
  if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      // Define variables
      $name = $_POST['name'];
      $dob = $_POST['dob'];
      $gender = $_POST['gender'];
      $medicalHistory = $_POST['medicalHistory'];
      $xrayImage = $_FILES['xrayImage'];

      // File upload path
      $uploadDir = 'uploads/';
      $uploadFilePath = __DIR__ . '/' . $uploadDir . basename($xrayImage['name']);
      
      // Ensure the uploads directory exists
      if (!is_dir($uploadDir)) {
          mkdir($uploadDir, 0777, true);
      }

      try {
          // Connect to the PostgreSQL database
          $pdo = new PDO("pgsql:host=$host;dbname=$db", $user, $pass);
          $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

          // Move uploaded file
          if (move_uploaded_file($xrayImage['tmp_name'], $uploadFilePath)) {
              // Insert data into the database
              $sql = "INSERT INTO patients (name, dob, gender, medical_history, xray_image_path) VALUES (:name, :dob, :gender, :medical_history, :xray_image_path)";
              $stmt = $pdo->prepare($sql);
              $stmt->execute([
                  ':name' => $name,
                  ':dob' => $dob,
                  ':gender' => $gender,
                  ':medical_history' => $medicalHistory,
                  ':xray_image_path' => $uploadFilePath,
              ]);

              echo "<p>Patient created successfully.</p>";
              echo "<p>Patient Name: " . htmlspecialchars($name) . "</p>";
              echo "<p>Date of Birth: " . htmlspecialchars($dob) . "</p>";
              echo "<p>Gender: " . htmlspecialchars($gender) . "</p>";
              echo "<p>Medical History: " . nl2br(htmlspecialchars($medicalHistory)) . "</p>";
              echo "<p>X-ray Image: <a href='$uploadFilePath' target='_blank'>View Image</a></p>";
          } else {
              echo "<p>There was an error uploading the file.</p>";
          }
      } catch (PDOException $e) {
          echo "<p>Error saving patient data: " . $e->getMessage() . "</p>";
      }
  }
  ?>

  <form action="" method="POST" enctype="multipart/form-data">
    <label for="name">Name:</label><br>
    <input type="text" id="name" name="name" required><br><br>

    <label for="dob">Date of Birth:</label><br>
    <input type="date" id="dob" name="dob" required><br><br>

    <label for="gender">Gender:</label><br>
    <select id="gender" name="gender" required>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select><br><br>

    <label for="medicalHistory">Medical History:</label><br>
    <textarea id="medicalHistory" name="medicalHistory" rows="4" cols="50"></textarea><br><br>

    <label for="xrayImage">X-ray Image:</label><br>
    <input type="file" id="xrayImage" name="xrayImage" accept="image/*" required><br><br>

    <input type="submit" value="Submit">
  </form>
</body>
</html>
