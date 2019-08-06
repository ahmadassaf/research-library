package code.src;

import twitter4j.Query;
import twitter4j.Status;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

/**
 * Created by IntelliJ IDEA.
 * User: fabio
 * Date: 10/07/2013
 * Time: 10:36
 * To change this template use File | Settings | File Templates.
 */
public class GetTweetsIntoSolrServlet extends javax.servlet.http.HttpServlet {
    protected void doGet (javax.servlet.http.HttpServletRequest request, javax.servlet.http.HttpServletResponse response) throws javax.servlet.ServletException, IOException {
        doPost(request, response);
    }

    protected void doPost(javax.servlet.http.HttpServletRequest request, javax.servlet.http.HttpServletResponse response) throws javax.servlet.ServletException, IOException {
        response.setContentType("text/html");
        PrintWriter out = response.getWriter();
        out.println("<title>Example</title>" + "<body bgcolor=FFFFFF>");
        out.println("<h2>all tweets loaded</h2>");
        String queryFromUser = request.getParameter("query");
        if (queryFromUser != null) {
            out.println(queryFromUser);
            SolrTweet solrTweet = new SolrTweet();
            Query query = new Query(queryFromUser).lang("en");
            List<Status> tweetList = solrTweet.search(query, 1, 2);
            try {
                for (Status tweet : tweetList)
                    solrTweet.ProcessAndAddTweetToSolr(tweet);
            } catch (Exception e) {
                e.printStackTrace();
            }

        } else {
            out.println("No text entered.");
        }
        out.println("<P>Return to <A HREF=\"../simpleHTML.html\">Form</A>");
        out.close();
    }

}

