import { Plugin, PluginContext, PluginCategory } from '../../src/types';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';

const execAsync = promisify(exec);

export default class JavaBuildPlugin implements Plugin {
  name = 'java-build';
  description = 'Build Java applications using Maven or Gradle';
  version = '1.0.0';
  category = PluginCategory.BUILD;

  async execute(context: PluginContext): Promise<void> {
    const { buildType, target, projectPath } = context.parameters || {};
    
    const buildTool = buildType || 'maven';
    const buildTarget = target || 'clean install';
    const projectDir = projectPath || context.projectFolder || process.cwd();

    console.log(chalk.blue(`🏗️ Building Java project with ${buildTool}`));
    console.log(chalk.gray(`Project path: ${projectDir}`));
    console.log(chalk.gray(`Build target: ${buildTarget}`));

    try {
      // Check if project directory exists
      if (!(await fs.pathExists(projectDir))) {
        throw new Error(`Project directory does not exist: ${projectDir}`);
      }

      // Check for build tool configuration
      const hasPomXml = await fs.pathExists(path.join(projectDir, 'pom.xml'));
      const hasGradle = await fs.pathExists(path.join(projectDir, 'build.gradle')) || 
                       await fs.pathExists(path.join(projectDir, 'build.gradle.kts'));

      if (buildTool === 'maven' && !hasPomXml) {
        throw new Error('Maven project not found (no pom.xml)');
      }

      if (buildTool === 'gradle' && !hasGradle) {
        throw new Error('Gradle project not found (no build.gradle)');
      }

      // Execute build command
      let buildCommand: string;
      if (buildTool === 'maven') {
        buildCommand = `mvn ${buildTarget}`;
      } else if (buildTool === 'gradle') {
        buildCommand = `./gradlew ${buildTarget}`;
      } else {
        throw new Error(`Unsupported build tool: ${buildTool}`);
      }

      console.log(chalk.gray(`Executing: ${buildCommand}`));
      
      const { stdout, stderr } = await execAsync(buildCommand, {
        cwd: projectDir
      });
      
      if (stderr && !stderr.includes('WARNING')) {
        console.warn(chalk.yellow(`Build warnings: ${stderr}`));
      }
      
      console.log(chalk.green(`✅ Java build completed successfully`));
      console.log(chalk.gray('Build output:'));
      console.log(chalk.gray(stdout));
      
      // Look for built artifacts
      const targetDir = path.join(projectDir, 'target');
      if (await fs.pathExists(targetDir)) {
        const artifacts = await fs.readdir(targetDir);
        const jarFiles = artifacts.filter(file => file.endsWith('.jar'));
        if (jarFiles.length > 0) {
          console.log(chalk.cyan(`📦 Built artifacts: ${jarFiles.join(', ')}`));
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Java build failed: ${error}`));
      throw error;
    }
  }
}
