load('jsmake.dotnet.DotNetUtils.js');
load('tools/JSLint-2011.06.08/jslint.js');
load('jsmake.javascript.JavascriptUtils.js');

var fs = jsmake.Fs;
var utils = jsmake.Utils;
var sys = jsmake.Sys;
var dotnet = new jsmake.dotnet.DotNetUtils();
var javascript = new jsmake.javascript.JavascriptUtils();

var version;

task('default', 'test');

task('version', function () {
	version = JSON.parse(fs.readFile('version.json'));
});

task('dependencies', function () {
	var pkgs = fs.createScanner('src').include('**/packages.config').scan();
	dotnet.downloadNuGetPackages(pkgs, 'lib');
});

task('assemblyinfo', 'version', function () {
	dotnet.writeAssemblyInfo('src/SharedAssemblyInfo.cs', {
		AssemblyTitle: 'ExtDirectHandler',
		AssemblyProduct: 'ExtDirectHandler',
		AssemblyDescription: 'Ext Direct router implementation for ASP.NET',
		AssemblyCopyright: 'Copyright � Gian Marco Gherardi ' + new Date().getFullYear(),
		AssemblyTrademark: '',
		AssemblyCompany: 'Gian Marco Gherardi',
		AssemblyConfiguration: '', // Probably a good place to put Git SHA1 and build date
		AssemblyVersion: [ version.major, version.minor, version.build, version.revision ].join('.'),
		AssemblyFileVersion: [ version.major, version.minor, version.build, version.revision ].join('.'),
		AssemblyInformationalVersion: [ version.major, version.minor, version.build, version.revision ].join('.')
	});
});

task('jslint', function () {
	// Visual Studio set Javascript files encoding as "UTF-8 with signature". This cause problem with JSLint.
	// As a workarount, when creating a new js file, select File => Save as... => Save with encoding... => "UTF-8 without signature"
	// See http://forums.silverlight.net/forums/t/144306.aspx
	var files = fs.createScanner('src/SampleWebApplication')
		.include('**/*.js')
		.exclude('jasmine-*')
		.exclude('extjs')
		.scan();
	var options = { white: true, onevar: true, undef: true, regexp: true, plusplus: true, bitwise: true, newcap: true, sloppy: true };
	var globals = { 'Ext': false, 'Sample': false };
	javascript.jslint(files, options, globals);
});

task('build', [ 'dependencies', 'assemblyinfo' ], function () {
	dotnet.runMSBuild('src/ExtDirectHandler.sln', [ 'Clean', 'Rebuild' ]);
});

task('test', 'build', function () {
	var testDlls = fs.createScanner('build/bin').include('**/*Tests.dll').scan();
	dotnet.runNUnit(testDlls);
});

task('release', 'test', function () {
	fs.deletePath('build');
	dotnet.deployToNuGet('src/ExtDirectHandler/ExtDirectHandler.csproj', 'build');
/*
	dotnet.runMSBuild('src/ExtDirectHandler.sln', [ 'Clean', 'ExtDirectHandler:Rebuild' ]);
	fs.zipPath('build/bin', 'build/extdirecthandler-' + [ version.major, version.minor, version.build, version.revision ].join('.') + '.zip');
*/
	version.revision += 1;
	fs.writeFile('version.json', JSON.stringify(version));
});

