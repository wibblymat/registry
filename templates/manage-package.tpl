<!doctype html>
<html>
	<head>
		<title>Modifying <%= name %></title>
		<script>
			var packageName = '<%= name %>';

			var del = function () {
				if (confirm('Are you sure you want to delete ' + packageName + '?')) {
					var xhr = new XMLHttpRequest();
					xhr.open('DELETE', '/packages/' + packageName, true);
					xhr.onreadystatechange = function () {
						if (xhr.readyState === 4) {
							alert(xhr.status + ': ' + xhr.responseText);
						}
					};
					xhr.send();
				}
			};

		</script>
	</head>
	<body>
		<h1>Modifying <%= name %></h1>
		<label for="name">Name</label><input type="text" name="name" value="<%= name %>" />
		<label for="url">URL</label><input type="text" name="url" value="<%= url %>" />
		<button>Update</button>
		<button onclick="del();">Delete</button>
	</body>
</html>
