import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringWriter;

import org.eclipse.jdt.core.compiler.batch.BatchCompiler;

/**
 * Small browser entry point for Eclipse's standalone Java compiler.
 *
 * The JDK compiler path required the complete 17 MB tools.jar and caused
 * CheerpJ to fetch a large dependency graph lazily on the first successful
 * compile. ECJ is a self-contained 3 MB compiler. This wrapper keeps the
 * existing contract: the first log line is 0/1 and the remaining text is
 * suitable for the learner-facing compiler console.
 *
 * Rebuild with:
 *   javac --release 8 -cp public/java/ecj-3.26.0.jar -d /tmp/pc-ecj tools/java/PcEcjCompile.java
 *   jar cf public/java/pc-ecj-v1.jar -C /tmp/pc-ecj PcEcjCompile.class
 */
public final class PcEcjCompile {
  private PcEcjCompile() {}

  public static void main(String[] args) throws Exception {
    String logPath = args[0];
    String[] compilerArgs = new String[args.length - 1];
    System.arraycopy(args, 1, compilerArgs, 0, compilerArgs.length);

    StringWriter output = new StringWriter();
    StringWriter errors = new StringWriter();
    boolean compiled = false;
    Throwable crash = null;
    try {
      compiled = BatchCompiler.compile(
        compilerArgs,
        new PrintWriter(output),
        new PrintWriter(errors),
        null
      );
    } catch (Throwable error) {
      crash = error;
    }

    PrintWriter log = new PrintWriter(new FileWriter(logPath));
    try {
      log.println(compiled ? 0 : 1);
      if (output.getBuffer().length() > 0) log.print(output.toString());
      if (errors.getBuffer().length() > 0) log.print(errors.toString());
      if (crash != null) log.println("The compiler crashed before finishing: " + crash);
    } finally {
      log.close();
    }
  }
}
